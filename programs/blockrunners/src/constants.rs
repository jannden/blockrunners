use anchor_lang::constant;

#[constant]
pub const CIPHER_COST: u64 = 1_000;

#[constant]
pub const DISCRIMINATOR_SIZE: u8 = 8;

#[constant]
pub const INITIAL_PRIZE_POOL: u64 = 0;

#[constant]
pub const INITIAL_PATH_LENGTH: u8 = 20;

#[constant]
pub const GAME_STATE_SEED: &[u8] = b"game_state";

#[constant]
pub const MAX_FEED_EVENTS: u8 = 20;

#[constant]
pub const MAX_RANDOMNESS_VALUES: u8 = 32;

#[constant]
pub const PLAYER_STATE_SEED: &[u8] = b"player_state";

/// Move success probability as a percentage (out of 100)
#[constant]
pub const MOVE_SUCCESS_PROBABILITY: u8 = 75;

/// Revenue distribution percentages
#[constant]
pub const PRIZE_POOL_PERCENTAGE: u8 = 88;
