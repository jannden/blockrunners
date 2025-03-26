use anchor_lang::prelude::*;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum FeedEventType {
    PlayerJoined,
    CardUsed,
    GameWon,
}

impl Space for FeedEventType {
    const INIT_SPACE: usize = 1;
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
#[derive(InitSpace)]
pub struct FeedEvent {
    pub event_type: FeedEventType,
    #[max_len(100)]
    pub message: String,
    pub timestamp: i64,
    pub player: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct SocialFeed {
    pub authority: Pubkey,
    #[max_len(20)]
    pub events: Vec<FeedEvent>,
    pub bump: u8,
} 