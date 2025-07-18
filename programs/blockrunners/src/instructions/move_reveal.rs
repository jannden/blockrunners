use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_STATE_SEED, MOVE_SUCCESS_PROBABILITY, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{Card, CardCounts, CardUsage, GameState, PlayerState, SocialFeedEventType},
    utils::{
        get_move_cost, give_random_cards, randomness_reveal, randomness_use, save_and_emit_event,
    },
};

#[derive(Accounts)]
pub struct MoveReveal<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut,
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(mut,
      seeds = [GAME_STATE_SEED],
      bump
    )]
    pub game_state: Account<'info, GameState>,

    /// CHECK: This account is validated in the instruction handler
    #[account()]
    pub randomness_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn move_reveal(ctx: Context<MoveReveal>) -> Result<()> {
    let player = &mut ctx.accounts.player;
    let game_state = &mut ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;
    let randomness_account = &ctx.accounts.randomness_account;

    update_last_login(player_state)?;

    // Check if player is part of the current game
    require!(
        player_state.game_start == Some(game_state.start),
        BlockrunnersError::PlayingInDifferentGame
    );

    // Check if player has already completed the path
    require!(
        player_state.position < game_state.path_length,
        BlockrunnersError::PathAlreadyCompleted
    );

    // Process card usage - validate and apply effects
    let used_cards = player_state
        .move_cards
        .ok_or(BlockrunnersError::MoveNotCommitted)?;
    let total_cost = get_move_cost(player_state, &used_cards)?;
    require!(
        player_state.ciphers >= total_cost,
        BlockrunnersError::InsufficientBalance
    );
    player_state.ciphers = player_state.ciphers.saturating_sub(total_cost);

    // Remove each used card from player's inventory
    if used_cards.shield {
        require!(
            player_state.cards.remove_card(Card::Shield),
            BlockrunnersError::InsufficientCards
        );
    }
    if used_cards.doubler {
        require!(
            player_state.cards.remove_card(Card::Doubler),
            BlockrunnersError::InsufficientCards
        );
    }
    if used_cards.swift {
        require!(
            player_state.cards.remove_card(Card::Swift),
            BlockrunnersError::InsufficientCards
        );
    }

    // Reveal randomness
    randomness_reveal(player_state, randomness_account)?;

    // Determine the correct direction based on the randomness value and success probability
    let random_value = randomness_use(player_state)?;
    let is_move_successful = (random_value % 100) < MOVE_SUCCESS_PROBABILITY;

    if is_move_successful {
        handle_correct_move(player_state, game_state, used_cards)?;

        if player_state.position == game_state.path_length {
            handle_win(player, game_state, player_state)?;
        }
    } else {
        handle_incorrect_move(player_state, used_cards)?;
    };

    // Reset player's move & cards commitment
    player_state.move_direction = None;
    player_state.move_cards = None;
    player_state.randomness_account = None;
    player_state.randomness_slot = None;
    player_state.randomness_value = None;

    Ok(())
}

fn handle_correct_move(
    player_state: &mut Account<PlayerState>,
    game_state: &mut Account<GameState>,
    card_usage: CardUsage,
) -> Result<()> {
    // Correct move: advance one step
    player_state.position += 1;
    let new_position = player_state.position;

    // Update statistics
    player_state.total_steps += 1;

    // Check for personal best position
    if new_position > player_state.best_position {
        player_state.best_position = new_position;

        let personal_message = format!(
            "PERSONAL BEST: New furthest infiltration depth reached: {} steps!",
            new_position
        );
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PersonalBest,
            personal_message,
        )?;
    }

    // Check for milestone notifications
    crate::utils::check_milestones(player_state, game_state)?;

    // Base message
    let mut private_message = format!("Advanced to position {}!", new_position);

    // Apply doubler effect
    let collect_cards_count = if card_usage.doubler { 2 } else { 1 };

    // Collect cards based on success and doubler
    give_random_cards(player_state, collect_cards_count)?;
    player_state.cards_collected += collect_cards_count as u64;

    // Build event message
    let mut card_effects = Vec::new();
    if card_usage.doubler {
        card_effects.push("Doubler (2 cards collected)");
    }
    if card_usage.shield {
        card_effects.push("Shield");
        player_state.shields_used += 1;
    }
    if card_usage.swift {
        card_effects.push("Swift (cipher refund)");
    }

    if !card_effects.is_empty() {
        private_message = format!(
            "{} Cards used: {}",
            private_message,
            card_effects.join(", ")
        );
    }

    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::PlayerMoved,
        private_message,
    )?;

    Ok(())
}

fn handle_incorrect_move(
    player_state: &mut Account<PlayerState>,
    card_usage: CardUsage,
) -> Result<()> {
    if card_usage.shield {
        let mut private_message = format!(
            "Shield protocol activated! Maintaining position {}.",
            player_state.position
        );

        let mut other_cards = Vec::new();
        if card_usage.doubler {
            other_cards.push("Doubler");
        }
        if card_usage.swift {
            other_cards.push("Swift (cipher refund)");
        }

        if !other_cards.is_empty() {
            private_message = format!("{}. Also used: {}", private_message, other_cards.join(", "));
        }

        player_state.shields_used += 1;

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            private_message,
        )?;
    } else {
        // No shield = reset to start
        let reset_position = player_state.position;
        player_state.position = 0;
        player_state.cards = CardCounts::default();
        player_state.total_resets += 1;

        // Reset consecutive wins
        player_state.consecutive_wins = 0;

        // Build event message for incorrect move
        let mut private_message = format!(
            "CONSENSUS DETECTED: Connection severed at depth {}. Returning to entry point.",
            reset_position
        );

        let mut cards_used = Vec::new();
        if card_usage.doubler {
            cards_used.push("Doubler");
        }
        if card_usage.swift {
            cards_used.push("Swift (cipher refund)");
        }

        if !cards_used.is_empty() {
            private_message = format!("{} Cards used: {}", private_message, cards_used.join(", "));
        }

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::ResetAlert,
            private_message,
        )?;
    }

    Ok(())
}

fn handle_win(
    player: &Signer,
    game_state: &mut Account<GameState>,
    player_state: &mut Account<PlayerState>,
) -> Result<()> {
    // Update win statistics
    player_state.games_won = player_state
        .games_won
        .checked_add(1)
        .ok_or(BlockrunnersError::UnknownError)?;

    // Update win streak
    player_state.consecutive_wins += 1;
    if player_state.consecutive_wins > player_state.best_win_streak {
        player_state.best_win_streak = player_state.consecutive_wins;

        // Notify about new win streak record
        let streak_message = format!(
            "STREAK RECORD: New personal best win streak of {} successful infiltrations!",
            player_state.consecutive_wins
        );
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PersonalBest,
            streak_message,
        )?;
    }

    // Verify we have enough lamports before transfer
    let current_lamports = game_state.to_account_info().lamports();
    require!(
        current_lamports >= game_state.prize_pool,
        BlockrunnersError::InsufficientBalance
    );

    // check if there's any prize to distribute from the pool
    let prize_amount = game_state.prize_pool;

    if prize_amount > 0 {
        let global_message =
            format!("PROTOCOL BREACH SUCCESSFUL: Distributing recovered data fragments!");
        save_and_emit_event(
            &mut game_state.game_events,
            SocialFeedEventType::GameWon,
            global_message,
        )?;

        // Subtract prize from game state
        **game_state.to_account_info().try_borrow_mut_lamports()? = game_state
            .to_account_info()
            .lamports()
            .checked_sub(prize_amount)
            .ok_or(BlockrunnersError::ArithmeticOverflow)?;

        // Add prize to player
        **player.try_borrow_mut_lamports()? = player
            .lamports()
            .checked_add(prize_amount)
            .ok_or(BlockrunnersError::ArithmeticOverflow)?;

        msg!("Prize transferred successfully!");

        // Reset the prize pool
        game_state.prize_pool = 0;
        msg!("Prize pool reset to 0.");
    } else {
        msg!("Player won, but there's nothing in the pool.");
    }

    // Create global win message for everyone
    let player_key_str = player.key().to_string();
    let global_message = format!(
        "CONSENSUS BREACH: Runner {}...{} extracted protocol fragment after {} steps. Reward: {} lamports",
        &player_key_str[0..4],
        &player_key_str[player_key_str.len() - 4..],
        player_state.position,
        prize_amount
    );

    // Announce to global feed
    save_and_emit_event(
        &mut game_state.game_events,
        SocialFeedEventType::GameWon,
        global_message,
    )?;

    // Create personal congrats for winner
    let private_message = if player_state.consecutive_wins > 1 {
        format!(
            "MISSION COMPLETE: Protocol fragment secured! Streak: {} | Reward: {} lamports",
            player_state.consecutive_wins, prize_amount
        )
    } else {
        format!(
            "MISSION COMPLETE: Protocol fragment secured! Reward: {} lamports",
            prize_amount
        )
    };

    // Announce to player's feed
    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::GameWon,
        private_message,
    )?;

    // Check for achievements
    crate::utils::check_and_award_achievements(player_state, game_state)?;

    // Update game start time to trigger resets for all players with a new timestamp set
    let clock = Clock::get()?;
    game_state.start = clock.unix_timestamp;

    Ok(())
}
