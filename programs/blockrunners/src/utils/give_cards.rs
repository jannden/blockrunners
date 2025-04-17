use anchor_lang::prelude::*;

use crate::{
    constants::{CARD_TYPES_COUNT, MAX_TOTAL_CARDS},
    errors::BlockrunnersError,
    state::{Card, PlayerState, SocialFeedEventType},
    utils::save_and_emit_event,
};

pub fn give_cards(player_state: &mut Account<PlayerState>, card_count: u8) -> Result<()> {
    // Check if player has reached max card limit
    let space_left = MAX_TOTAL_CARDS.saturating_sub(player_state.cards.len() as u8);
    if space_left == 0 {
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerCardsMaxRange,
            "You have already collected the maximum number of cards.".to_string(),
        )?;
        return Ok(());
    }

    // Limit cards to give based on available space
    let adjusted_card_count = std::cmp::min(card_count, space_left);
    if adjusted_card_count == 0 {
        return Ok(());
    }

    // Get randomness value or return error if not available
    let randomness_value = player_state
        .randomness_value
        .ok_or(BlockrunnersError::RandomnessNotResolved)?;

    // Generate cards using the randomness
    let mut remaining_value = randomness_value;
    let mut cards_given = Vec::with_capacity(adjusted_card_count as usize);

    for _ in 0..adjusted_card_count {
        // Use lowest 2 bits for each card selection
        let card_index = (remaining_value & 0b11) as u32 % (CARD_TYPES_COUNT as u32);

        // Select card based on random index
        let new_card = match card_index {
            0 => Card::Shield,
            1 => Card::Doubler,
            2 => Card::Swift,
            _ => unreachable!(), // This should never happen due to the modulo operation
        };

        // Add card to player's collection
        player_state.cards.push(new_card);
        cards_given.push(new_card);

        // Shift right to use next 2 bits for next card
        remaining_value >>= 2;
    }

    // Create summary of cards received
    let cards_summary = if cards_given.len() == 1 {
        format!("You have collected a new card: {:?}", cards_given[0])
    } else {
        let cards_str = cards_given.iter().fold(String::new(), |acc, card| {
            if acc.is_empty() {
                format!("{:?}", card)
            } else {
                format!("{}, {:?}", acc, card)
            }
        });
        format!(
            "You have collected {} new cards: {}",
            cards_given.len(),
            cards_str
        )
    };

    // Log the event
    crate::utils::save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::PlayerCardCollected,
        cards_summary,
    )?;

    Ok(())
}
