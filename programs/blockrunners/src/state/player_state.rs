use anchor_lang::prelude::*;
use strum_macros::EnumCount as EnumCountMacro;

use crate::{
    constants::{MAX_FEED_EVENTS, MAX_TOTAL_CARDS},
    state::SocialFeedEvent,
};

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Debug, EnumCountMacro)]
pub enum Cards {
    Shield,
    Doubler,
    Swift,
}

impl Space for Cards {
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
    pub cards: Vec<Cards>,

    /// Current block number
    pub position: u8,

    // Path now stores only generated steps, no longer the entire path
    #[max_len(20)]
    pub path: Vec<PathDirection>,

    /// Store bump to save compute
    pub bump: u8,

    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,

    /// The player has joined the game or not
    pub in_game: bool,
}
