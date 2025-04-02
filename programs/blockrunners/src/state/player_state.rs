use anchor_lang::prelude::*;

use crate::{constants::MAX_FEED_EVENTS, state::SocialFeedEvent };

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Debug)]
pub enum Cards {
    Shield,
    Doubler,
    Swift
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

    #[max_len(20)]
    pub cards: Vec<Cards>,

    /// Current block number
    pub position: u8,

    #[max_len(20)]
    pub path: Vec<PathDirection>,

    /// Store bump to save compute
    pub bump: u8,

    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,
}
