use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_STATE_SEED, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{Card, CardUsage, GameState, PathDirection, PlayerState, SocialFeedEventType},
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
    let game_state = &mut ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;
    let randomness_account = &ctx.accounts.randomness_account;

    // tommy: check if player needs to be reset due to game completion
    require!(
        player_state.game_start == game_state.start,
        BlockrunnersError::InsufficientBalance
    );

    update_last_login(player_state)?;

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
    player_state.ciphers -= total_cost;

    // Reveal randomness
    randomness_reveal(player_state, randomness_account)?;

    // TODO: Remove used cards from player's inventory and make player_state.cards HashMap

    // Determine the correct direction based on the randomness value
    let correct_direction = if randomness_use(player_state)? % 2 == 0 {
        PathDirection::Left
    } else {
        PathDirection::Right
    };

    if player_state.move_direction == Some(correct_direction) {
        handle_correct_move(game_state, player_state, used_cards)?;
    } else {
        handle_incorrect_move(player_state, used_cards)?;
    }

    Ok(())
}

fn handle_correct_move(
    game_state: &mut Account<GameState>,
    player_state: &mut Account<PlayerState>,
    card_usage: CardUsage,
) -> Result<()> {
    // changed return type since we don't check win here anymore
    // Correct move: advance one step
    player_state.position += 1;
    let new_position = player_state.position;

    // Base message
    let mut event_message = format!("Player advanced to position {}!", new_position);

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
        event_message = format!("{}! Cards used: {}", event_message, card_effects.join(", "));
    }

    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::PlayerMoved,
        event_message,
    )?;

    Ok(())
}

fn handle_incorrect_move(
    player_state: &mut Account<PlayerState>,
    card_usage: CardUsage,
) -> Result<()> {
    if card_usage.shield {
        // Still collect one card on incorrect move with shield
        // For the same reason as in handle_correct_move, we'll simplify this for now
        if player_state.cards.len() < crate::constants::MAX_TOTAL_CARDS as usize {
            player_state.cards.push(Card::Shield);

            save_and_emit_event(
                &mut player_state.player_events,
                SocialFeedEventType::PlayerCardCollected,
                format!("You have collected a new card: {:?}", Card::Shield),
            )?;
        }

        // Build event message
        let mut event_message = format!(
            "Player used a Shield card! Staying at position {}.",
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
            event_message = format!("{}. Also used: {}", event_message, other_cards.join(", "));
        }

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            event_message,
        )?;
    } else {
        // No shield = reset to start
        player_state.position = 0;
        player_state.cards = vec![Card::Shield, Card::Doubler, Card::Swift];

        // Build event message for incorrect move
        let mut event_message = "Player made an incorrect move and reset to the start!".to_string();

        let mut cards_used = Vec::new();
        if card_usage.doubler {
            cards_used.push("Doubler");
        }
        if card_usage.swift {
            cards_used.push("Swift (cipher refund)");
        }

        if !cards_used.is_empty() {
            event_message = format!("{}. Cards used: {}", event_message, cards_used.join(", "));
        }

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            event_message,
        )?;
    }

    Ok(())
}
