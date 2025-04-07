use anchor_lang::{prelude::*, solana_program::hash::hash};
use rand_chacha::ChaChaRng;
use rand_core::{RngCore, SeedableRng};

use crate::state::{PathDirection, PlayerState};

pub fn generate_player_path(
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

    // Generate only the first step (not the entire path)
    let first_direction = match rng.next_u32() % 2 {
        0 => PathDirection::Left,
        1 => PathDirection::Right,
        _ => {
            // this should never happen b/c we mod by 2
            msg!("UNEXPECTED: mod 2 operation produced value other than 0 or 1!");
            PathDirection::Right // Default to right direction as fallback
        }
    };

    // Initialize path with only the first step
    let mut path = Vec::new();
    path.push(first_direction);
    
    player.path = path;

    msg!("Player path initialized with first step only");

    Ok(())
}
