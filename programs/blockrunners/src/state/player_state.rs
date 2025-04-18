use anchor_lang::prelude::*;
use strum_macros::EnumCount as EnumCountMacro;

use crate::{
    constants::{MAX_FEED_EVENTS, MAX_TOTAL_CARDS},
    state::SocialFeedEvent,
};

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Debug, EnumCountMacro, Hash, Eq)]
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

    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,

    /// The player has joined the game or not
    pub in_game: bool,
}
