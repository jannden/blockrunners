use anchor_lang::prelude::*;

use crate::{
    errors::BlockrunnersError,
    state::{Card, CardUsage, PlayerState},
};

pub fn get_move_cost(player_state: &PlayerState, used_cards: &CardUsage) -> Result<u64> {
    // Get card usage flags
    let used_cards_flags = vec![
        (Card::Shield, used_cards.shield),
        (Card::Doubler, used_cards.doubler),
        (Card::Swift, used_cards.swift),
    ];

    // Early exit if no cards used
    if !used_cards_flags.iter().any(|(_, is_used)| *is_used) {
        return Ok(0);
    }

    // Count required cards and calculate cost
    let needed_cards: Vec<Card> = used_cards_flags
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

    // Apply swift card effect
    if used_cards.swift {
        total_cost -= 2;
    }

    // Base cost for move
    total_cost += 1;

    Ok(total_cost)
}
