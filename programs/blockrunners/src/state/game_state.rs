use anchor_lang::prelude::*;

use crate::{constants::MAX_FEED_EVENTS, state::SocialFeedEvent};

#[account]
#[derive(InitSpace)]
pub struct GameState {
    /// Authority
    pub authority: Pubkey,

    /// The current prize pool amount in lamports
    pub prize_pool: u64,

    /// The length of the path players need to navigate
    pub path_length: u8,

    #[max_len(MAX_FEED_EVENTS)]
    pub game_events: Vec<SocialFeedEvent>,
}
