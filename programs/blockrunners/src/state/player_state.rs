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

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    pub player: Pubkey,

    /// Number of ciphers owned
    pub ciphers: u64,

    #[max_len(MAX_TOTAL_CARDS)]
    pub cards: Vec<Card>,

    /// Current block number
    pub position: u8,

    /// Store bump to save compute
    pub bump: u8,

    /// tommy: The Unix timestamp of the game instance this player is part of i think
    pub game_start: i64,

    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,

    /// The player has joined the game or not
    pub in_game: bool,

    /// Player statistics
    pub first_login: i64,
    pub last_login: i64,
    pub games_won: u64,
    pub total_ciphers_bought: u64,

    /// Switchboard randomness account for player-specific randomness
    pub randomness_account: Pubkey,

    /// The slot at which the randomness was committed
    pub randomness_slot: Option<u64>,

    /// The randomness values generated for the player
    #[max_len(MAX_RANDOMNESS_VALUES)]
    pub randomness_value: Option<Vec<u8>>,
}
