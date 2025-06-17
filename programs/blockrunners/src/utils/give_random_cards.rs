use anchor_lang::prelude::*;

use crate::{
    state::{Card, PlayerState, SocialFeedEventType},
    utils::{randomness_use, save_and_emit_event},
};

pub fn give_random_cards(player_state: &mut Account<PlayerState>, card_count: u8) -> Result<()> {
    if card_count == 0 {
        return Ok(());
    }

    // Generate cards using the randomness
    let mut cards_given = Vec::with_capacity(card_count as usize);
    let mut cards_rejected = 0u8;

    for _ in 0..card_count {
        let card_index = randomness_use(player_state)? % Card::COUNT;

        // Select card based on random index
        let new_card = match card_index {
            0 => Card::Shield,
            1 => Card::Doubler,
            2 => Card::Swift,
            _ => unreachable!(), // This should never happen due to the modulo operation
        };

        // Add card to player's collection and track success
        if player_state.cards.add_card(new_card) {
            cards_given.push(new_card);
        } else {
            cards_rejected += 1;
        }
    }

    // Create summary of cards received
    if !cards_given.is_empty() {
        let private_message = if cards_given.len() == 1 {
            format!("You have collected a new card: {:?}", cards_given[0])
        } else {
            let cards_str = cards_given
                .iter()
                .map(|card| format!("{:?}", card))
                .collect::<Vec<String>>()
                .join(", ");
            format!(
                "You have collected {} new cards: {}",
                cards_given.len(),
                cards_str
            )
        };

        // Log the successful cards event
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerCardCollected,
            private_message,
        )?;
    }

    // Inform about rejected cards if any
    if cards_rejected > 0 {
        let private_message = if cards_rejected == 1 {
            "You've reached the maximum for one card type and couldn't collect 1 card.".to_string()
        } else {
            format!(
                "You've reached the maximum for some card types and couldn't collect {} cards.",
                cards_rejected
            )
        };

        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerCardsMaxRange,
            private_message,
        )?;
    }

    Ok(())
}
