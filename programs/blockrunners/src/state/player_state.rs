use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_FEED_EVENTS, MAX_RANDOMNESS_VALUES, MAX_TOTAL_CARDS},
    state::SocialFeedEvent,
};

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Debug, Hash, Eq)]
pub enum Card {
    Shield,
    Doubler,
    Swift,
}

impl Space for Card {
    const INIT_SPACE: usize = 1;
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum PathDirection {
    Left,
    Right,
}

impl Space for PathDirection {
    const INIT_SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct CardUsage {
    pub shield: bool,
    pub doubler: bool,
    pub swift: bool,
}

impl Space for CardUsage {
    const INIT_SPACE: usize = 3;
}

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    /// Number of ciphers owned
    pub ciphers: u64,

    /// Cards owned
    #[max_len(MAX_TOTAL_CARDS)]
    pub cards: Vec<Card>,

    /// Current position
    pub position: u8,

    /// Store bump to save compute
    pub bump: u8,

    /// Social feed events history
    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,

    /// Player statistics
    pub first_login: i64,
    pub last_login: i64,
    pub games_won: u64,
    pub total_ciphers_bought: u64,

    /// The Unix timestamp of the game instance this player is part of
    pub game_start: Option<i64>,

    /// Switchboard randomness account for player-specific randomness
    pub randomness_account: Option<Pubkey>,

    /// The slot at which the randomness was committed
    pub randomness_slot: Option<u64>,

    /// The randomness values generated for the player
    #[max_len(MAX_RANDOMNESS_VALUES)]
    pub randomness_value: Option<Vec<u8>>,

    /// Commitment to the move direction
    pub move_direction: Option<PathDirection>,

    /// Commitment to use cards
    pub move_cards: Option<CardUsage>,
}
