use anchor_lang::{prelude::*, solana_program::hash::hash};
use rand_chacha::ChaChaRng;
use rand_core::{RngCore, SeedableRng};

use crate::state::{PathDirection, PlayerState};

/// Generates the next direction for the player's path
/// This function is called after the player makes a move to determine if their move was correct
pub fn generate_next_direction_for_path(
    player: &Account<PlayerState>,
) -> PathDirection {
    // Use recent block hash, timestamp, and player's key as sources of randomness
    let recent_slothash = Clock::get().unwrap().slot;
    let recent_timestamp = Clock::get().unwrap().unix_timestamp;
    let mut combined_seed = player.key().to_bytes().to_vec();
    combined_seed.extend_from_slice(&recent_slothash.to_le_bytes());
    combined_seed.extend_from_slice(&recent_timestamp.to_le_bytes());
    
    // Hash the combined seed to get a fixed-length seed
    let seed = hash(&combined_seed).to_bytes();
    let mut rng = ChaChaRng::from_seed(seed);

    // Generate a random direction
    match rng.next_u32() % 2 {
        0 => PathDirection::Left,
        1 => PathDirection::Right,
        _ => unreachable!("We should never reach here because i % 2 is always 0 or 1."),
    }
}
