use anchor_lang::prelude::*;
use rand_chacha::ChaChaRng;
use rand_core::{RngCore, SeedableRng};

use crate::{
    constants::INITIAL_PATH_LENGTH, 
    state::PlayerPath
};

pub fn generate_player_path(
    player: &AccountInfo,
    player_path: &mut Account<PlayerPath>,
    bump: u8,
) -> Result<()> {
    let seed = player.key().to_bytes();
    let mut rng = ChaChaRng::from_seed(seed);

    let path: Vec<u8> = (0..INITIAL_PATH_LENGTH)
        .map(|_| (rng.next_u32() % 2) as u8)
        .collect();

    player_path.player = player.key();
    player_path.path = path;
    player_path.bump = bump;

    msg!("Player path initialized");

    Ok(())
}
