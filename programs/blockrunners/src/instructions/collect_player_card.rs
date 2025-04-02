use anchor_lang::{prelude::*, solana_program::hash::hash};
use rand_chacha::ChaChaRng;
use rand_core::{RngCore, SeedableRng};

use crate::{
    instructions::save_and_emit_event::save_and_emit_event,
    state::{Cards, PlayerState, SocialFeedEventType}
};

pub fn collect_player_card(
    player: &mut Account<PlayerState>,
) -> Result<()> {
    // Use recent block hash as an additional source of randomness
    let recent_slothash = Clock::get()?.slot;
    
    // Combine player key and recent slot hash for true randomness
    let mut combined_seed = player.key().to_bytes().to_vec();
    combined_seed.extend_from_slice(&recent_slothash.to_le_bytes());
    
    // Hash the combined seed to get a fixed-length seed
    let seed = hash(&combined_seed).to_bytes();
    let mut rng = ChaChaRng::from_seed(seed);

    // TODO: Update cards number
    let random_card_index = rng.next_u32() % 3;

    // Select the card based on the random index
    let new_card = match random_card_index {
        0 => Cards::Shield,
        1 => Cards::Doubler,
        2 => Cards::Swift,
        _ => Cards::Shield, // Default case, should never happen with current setup
    };

    player.cards.push(new_card);

    save_and_emit_event(
        &mut player.player_events,
        SocialFeedEventType::PlayerCardCollected,
        format!("You have collected a new card: {:?}", new_card),
    )?;

    Ok(())
}
