use anchor_lang::prelude::*;

use crate::{
    errors::BlockrunnersError,
    state::{Card, CardUsage, PlayerState},
};

pub fn get_move_cost(player_state: &PlayerState, used_cards: &CardUsage) -> Result<u64> {
    let mut total_cost = 1; // Base cost for move

    // Get card usage flags
    let used_cards_flags = vec![
        (Card::Shield, used_cards.shield),
        (Card::Doubler, used_cards.doubler),
        (Card::Swift, used_cards.swift),
    ];

    // Early exit if no cards used
    if !used_cards_flags.iter().any(|(_, is_used)| *is_used) {
        return Ok(total_cost);
    }

    // Count required cards and calculate cost
    let needed_cards: Vec<Card> = used_cards_flags
        .iter()
        .filter_map(|(card, is_used)| if *is_used { Some(card.clone()) } else { None })
        .collect();
    total_cost = total_cost.saturating_add(needed_cards.len() as u64);

    // Ensure player has all required cards
    for card in &needed_cards {
        require!(
            player_state.cards.has_card(*card),
            BlockrunnersError::InsufficientCards
        );
    }

    // Apply swift card effect
    if used_cards.swift {
        total_cost = total_cost.saturating_sub(2);
    }

    Ok(total_cost)
}
