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
        _ => unreachable!("We should never reach here because i % 2 is always 0 or 1.")
    };

    // Initialize path with only the first step
    let mut path = Vec::new();
    path.push(first_direction);
    
    player.path = path;

    msg!("Player path initialized with first step only");

    Ok(())
}
