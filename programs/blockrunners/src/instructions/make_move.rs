use anchor_lang::prelude::*;
use strum::EnumCount;

use crate::{
    errors::BlockrunnersError, 
    instructions::{collect_player_card, save_and_emit_event},
    state::{Cards, PathDirection, PlayerState, SocialFeedEventType}
};

#[derive(Accounts)]
pub struct MakeMove<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub player_state: Account<'info, PlayerState>,
}

#[derive(Clone, Debug)]
pub struct CardUsage {
    pub shield: bool,
    pub doubler: bool,
    pub swift: bool,
}

pub fn make_move(
    ctx: Context<MakeMove>, 
    direction: PathDirection, 
    cards: Vec<Cards>
) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let current_position = player_state.position as usize;

    require!(
        current_position < player_state.path.len(),
        BlockrunnersError::PathAlreadyCompleted
    );

    // Base cost for a move
    require!(player_state.ciphers >= 1, BlockrunnersError::InsufficientBalance);
    player_state.ciphers -= 1;

    // Process card usage - validate and apply effects
    let card_usage = process_cards(player_state, &cards)?;

    if direction == player_state.path[current_position] {
        handle_correct_move(player_state, card_usage)?;
    } else {
        handle_incorrect_move(player_state, card_usage, current_position)?;
    }
    
    Ok(())
}

fn process_cards(player_state: &mut PlayerState, cards: &Vec<Cards>) -> Result<CardUsage> {
    // Check if the number of cards is valid
    require!(
        cards.len() <= Cards::COUNT,
        BlockrunnersError::ExceedsMaxCards
    );

    let mut card_usage = CardUsage {
        shield: false,
        doubler: false,
        swift: false,
    };
    
    // Track used card types to prevent duplicates
    let mut used_card_types = Vec::new();

    for &card_type in cards {
        // Check if this card type has already been used in this move
        if used_card_types.contains(&card_type) {
            Err(error!(BlockrunnersError::DuplicateCard))?
        }
        
        // Find the card in player's inventory
        if let Some(index) = player_state.cards.iter().position(|&card| card == card_type) {
            // Remove the card from inventory
            player_state.cards.swap_remove(index);
            
            // Using a card costs an additional cipher
            require!(player_state.ciphers >= 1, BlockrunnersError::InsufficientBalance);
            player_state.ciphers -= 1;
            
            // Apply card effect
            match card_type {
                Cards::Shield => card_usage.shield = true,
                Cards::Doubler => card_usage.doubler = true,
                Cards::Swift => {
                    card_usage.swift = true;
                    // Swift card refunds up to 2 ciphers
                    let refund = player_state.ciphers.min(2);
                    player_state.ciphers += refund;
                },
            }
            
            // Mark this card type as used
            used_card_types.push(card_type);
        } else {
            Err(error!(BlockrunnersError::InsufficientCards))?
        }
    }

    Ok(card_usage)
}

fn handle_correct_move(player_state: &mut Account<PlayerState>, card_usage: CardUsage) -> Result<()> {
    player_state.position += 1;
    let new_position = player_state.position;
    
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
    
    msg!("Correct move! Advanced to position {}", new_position);
    
    Ok(())
}

fn handle_incorrect_move(
    player_state: &mut Account<PlayerState>, 
    card_usage: CardUsage, 
    current_position: usize
) -> Result<()> {
    if card_usage.shield {
        // Shield prevents reset on incorrect move
        msg!("Incorrect move but Shield was used! Staying at position {}", player_state.position);
        
        // Still collect one card on incorrect move with shield
        collect_player_card(player_state)?;
        
        // Build event message
        let mut event_message = format!("Player used a Shield card! Staying at position {}.", current_position);
        
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
        msg!("Incorrect move! Reset to start");
        
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
