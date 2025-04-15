use anchor_lang::prelude::*;

use crate::{
    constants::GAME_STATE_SEED,
    errors::BlockrunnersError,
    instructions::{collect_player_card, generate_next_direction_for_path, save_and_emit_event},
    state::{Card, GameState, PathDirection, PlayerState, SocialFeedEventType},
};

// tommy: step 1 - added mut to accounts we need to modify for prize money
#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut)]
    pub player_state: Account<'info, PlayerState>,

    #[account(
        mut,
        seeds = [GAME_STATE_SEED],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CardUsage {
    pub shield: bool,
    pub doubler: bool,
    pub swift: bool,
}

pub fn make_move(
    ctx: Context<MakeMove>,
    direction: PathDirection,
    card_usage: CardUsage,
) -> Result<()> {
    let game_state = &ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;
    
    // Check if player has already completed the path
    require!(
        player_state.position < game_state.path_length,
        BlockrunnersError::PathAlreadyCompleted
    );

    // Process card usage - validate and apply effects
    let total_cost = process_cards(player_state, &card_usage)?;
    require!(
        player_state.ciphers >= total_cost,
        BlockrunnersError::InsufficientBalance
    );
    player_state.ciphers -= total_cost;

    // Generate the correct direction for the current position
    let correct_direction = generate_next_direction_for_path(player_state);

    if direction == correct_direction {
        // tommy: step 1 - make the handle_correct_move just return true/false for win detection
        // tommy: step 2 - moved win handling here where we have access to ctx
        let player_won = handle_correct_move(game_state, player_state, card_usage)?;
        
        // tommy: step 3 - handle the win celebration stuff:
        if player_won {
            // check if there's any prize to distribute from the pool
            let prize_amount = game_state.prize_pool;

            if prize_amount > 0 {
                msg!("Yay! We are distributing prize of {} lamports", prize_amount);

                // tommy: step 1 - check if there's prize money to give
                // tommy: step 2 - grab lamports directly
                // tommy: step 3 - move the money from game state to player
                **game_state.to_account_info().try_borrow_mut_lamports()? -= prize_amount;
                **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += prize_amount; 

                msg!("Prize transferred successfully!");

                // reeset the prize pool back to zero!
                game_state.prize_pool = 0;
                msg!("Prize pool reset to 0.");
            } else {
                msg!("Player won, but there's no money in the pool dang.");
            }


            // tommy: step 1 - create the win message with player address and prize
            // tommy: step 2 - announce to everyone through game events
            // tommy: step 3 - give personal congrats through player events
            let win_message = format!(
                "Player {} has won the game with {} correct moves and collected {} SOL!",
                ctx.accounts.player.key(),  // use the signer's key
                player_state.position,
                prize_amount
            );

            // announce the message to global feed 
            save_and_emit_event(
                &mut game_state.game_events,
                SocialFeedEventType::GameWon,
                win_message.clone(),
            )?;

            // announce to player's feed (local)
            save_and_emit_event(
                &mut player_state.player_events,
                SocialFeedEventType::GameWon,
                win_message,
            )?;

            // tommy: step 1 - reset position to start
            // tommy: step 2 - clear their cards
            // tommy: step 3 - clean up their event feed
            player_state.position = 0;
            player_state.cards.clear();
            player_state.player_events.clear();
        }
    } else {
        handle_incorrect_move(player_state, card_usage)?;
    }

    Ok(())
}

fn process_cards(player_state: &mut PlayerState, card_usage: &CardUsage) -> Result<u64> {
    // Get card usage flags
    let cards_to_use = vec![
        (Card::Shield, card_usage.shield),
        (Card::Doubler, card_usage.doubler),
        (Card::Swift, card_usage.swift),
    ];

    // Early exit if no cards used
    if !cards_to_use.iter().any(|(_, is_used)| *is_used) {
        return Ok(0);
    }

    // Count required cards and calculate cost
    let needed_cards: Vec<Card> = cards_to_use
        .iter()
        .filter_map(|(card, is_used)| if *is_used { Some(card.clone()) } else { None })
        .collect();
    let mut total_cost = needed_cards.len() as u64;

    // Count player's cards
    let mut card_counts = std::collections::HashMap::new();
    for card in &player_state.cards {
        *card_counts.entry(card).or_insert(0) += 1;
    }

    // Ensure player has all required cards
    for card in &needed_cards {
        let count = card_counts.get(card).unwrap_or(&0);
        require!(*count > 0, BlockrunnersError::InsufficientCards);
    }

    // Apply card effects
    if card_usage.swift {
        total_cost -= 2;
    }

    // Remove used cards from inventory
    let mut cards_to_remove = needed_cards.clone();
    player_state.cards.retain(|card| {
        if let Some(pos) = cards_to_remove.iter().position(|c| c == card) {
            cards_to_remove.remove(pos);
            false
        } else {
            true
        }
    });

    // Base cost for move
    total_cost += 1;

    Ok(total_cost)
}

fn handle_correct_move(
    game_state: &Account<GameState>,
    player_state: &mut Account<PlayerState>,
    card_usage: CardUsage,
) -> Result<bool> { // added the bool here for true/false check
    // Correct move: advance one step
    player_state.position += 1;
    let new_position = player_state.position;

    // tommy: step 1 - check if they reached the end
    // tommy: step 2 - return true if they won
    // tommy: step 3 - let make_move handle all the celebration stuff
    if new_position >= game_state.path_length {
        return Ok(true);
    }

    // Base message
    let mut event_message = format!("Player advanced to position {}!", new_position);

    // Apply doubler effect
    let collect_cards_count = if card_usage.doubler { 2 } else { 1 };

    // Collect cards based on success and doubler
    for _ in 0..collect_cards_count {
        collect_player_card(player_state)?;
    }

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

    Ok(false)
}

fn handle_incorrect_move(
    player_state: &mut Account<PlayerState>,
    card_usage: CardUsage,
) -> Result<()> {
    if card_usage.shield {
        // Still collect one card on incorrect move with shield
        collect_player_card(player_state)?;

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
