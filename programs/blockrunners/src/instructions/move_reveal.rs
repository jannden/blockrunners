use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_STATE_SEED, MOVE_SUCCESS_PROBABILITY, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{Card, CardUsage, GameState, PlayerState, SocialFeedEventType},
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

    // Remove one of each used card from player's inventory, considering that usedCards is a struct (we can't iterate over) and player_state.cards is a vector
    // TODO: This is a bit of a hack, we should probably change the player_state.cards to a HashMap
    let mut cards_to_remove = Vec::new();
    if used_cards.shield {
        cards_to_remove.push(Card::Shield);
    }
    if used_cards.doubler {
        cards_to_remove.push(Card::Doubler);
    }
    if used_cards.swift {
        cards_to_remove.push(Card::Swift);
    }
    player_state.cards.retain(|card| {
        if let Some(pos) = cards_to_remove.iter().position(|c| c == card) {
            cards_to_remove.remove(pos);
            false
        } else {
            true
        }
    });

    // Reveal randomness
    randomness_reveal(player_state, randomness_account)?;

    // Determine the correct direction based on the randomness value and success probability
    let random_value = randomness_use(player_state)?;
    let is_move_successful = (random_value % 100) < MOVE_SUCCESS_PROBABILITY;

    if is_move_successful {
        handle_correct_move(player_state, used_cards)?;

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
    card_usage: CardUsage,
) -> Result<()> {
    // Correct move: advance one step
    player_state.position += 1;
    let new_position = player_state.position;

    // Base message
    let mut private_message = format!("Advanced to position {}!", new_position);

    // Apply doubler effect
    let collect_cards_count = if card_usage.doubler { 2 } else { 1 };

    // Collect cards based on success and doubler
    give_random_cards(player_state, collect_cards_count)?;

    // Build event message
    let mut card_effects = Vec::new();
    if card_usage.doubler {
        card_effects.push("Doubler (2 cards collected)");
    }
    if card_usage.shield {
        card_effects.push("Shield");
    }
    if card_usage.swift {
        card_effects.push("Swift (cipher refund)");
    }

    if !card_effects.is_empty() {
        private_message = format!(
            "{}! Cards used: {}",
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
            "Used a Shield card! Staying at position {}.",
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

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            private_message,
        )?;
    } else {
        // No shield = reset to start
        player_state.position = 0;
        player_state.cards = vec![Card::Shield, Card::Doubler, Card::Swift];

        // Build event message for incorrect move
        let mut private_message = "Incorrect move, back to start!".to_string();

        let mut cards_used = Vec::new();
        if card_usage.doubler {
            cards_used.push("Doubler");
        }
        if card_usage.swift {
            cards_used.push("Swift (cipher refund)");
        }

        if !cards_used.is_empty() {
            private_message = format!("{}. Cards used: {}", private_message, cards_used.join(", "));
        }

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
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
    player_state.games_won = player_state
        .games_won
        .checked_add(1)
        .ok_or(BlockrunnersError::UnknownError)?;

    // Verify we have enough lamports before transfer
    let current_lamports = game_state.to_account_info().lamports();
    require!(
        current_lamports >= game_state.prize_pool,
        BlockrunnersError::InsufficientBalance
    );

    // check if there's any prize to distribute from the pool
    let prize_amount = game_state.prize_pool;

    if prize_amount > 0 {
        let global_message = format!("Yay! Distributing the prize!");
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
    let global_message = format!(
        "Player {} has won the game with {} correct moves and collected {}!",
        player.key(), // use the signer's key
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
    let private_message = format!(
        "Congratulations! You won the game and collected {}!",
        prize_amount
    );

    // Announce to player's feed
    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::GameWon,
        private_message,
    )?;

    // Update game start time to trigger resets for all players with a new timestamp set
    let clock = Clock::get()?;
    game_state.start = clock.unix_timestamp;

    Ok(())
}
