use anchor_lang::{constant, solana_program::native_token::LAMPORTS_PER_SOL};

#[constant]
pub const DISCRIMINATOR_SIZE: u8 = 8;

#[constant]
pub const INITIAL_PRIZE_POOL: u64 = 0;

#[constant]
pub const INITIAL_PATH_LENGTH: u8 = 20;

#[constant]
pub const INITIAL_PLAYER_CARDS_AMOUNT: u64 = 1;

#[constant]
pub const CIPHER_COST: u64 = LAMPORTS_PER_SOL / 1000;

#[constant]
pub const MAX_FEED_EVENTS: u8 = 20;

#[constant]
pub const GAME_STATE_SEED: &[u8] = b"game_state";

#[constant]
pub const PLAYER_STATE_SEED: &[u8] = b"player_state";
