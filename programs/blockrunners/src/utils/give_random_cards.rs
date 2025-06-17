use anchor_lang::prelude::*;

use crate::{
    constants::{CARD_TYPES_COUNT, MAX_TOTAL_CARDS},
    state::{Card, PlayerState, SocialFeedEventType},
    utils::{randomness_use, save_and_emit_event},
};

pub fn give_random_cards(player_state: &mut Account<PlayerState>, card_count: u8) -> Result<()> {
    // Check if player has reached max card limit
    let space_left = MAX_TOTAL_CARDS.saturating_sub(player_state.cards.len() as u8);
    if space_left == 0 {
        // Announce to player's feed
        let private_message = "You have already collected the maximum number of cards.".to_string();
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerCardsMaxRange,
            private_message,
        )?;
        return Ok(());
    }

    // Limit cards to give based on available space
    let adjusted_card_count = std::cmp::min(card_count, space_left);
    if adjusted_card_count == 0 {
        return Ok(());
    }

    // Generate cards using the randomness
    let mut cards_given = Vec::with_capacity(adjusted_card_count as usize);

    for _ in 1..=adjusted_card_count {
        let card_index = randomness_use(player_state)? % CARD_TYPES_COUNT;

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
