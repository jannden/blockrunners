use anchor_lang::prelude::*;

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub enum SocialFeedEventType {
    PlayerJoined,
    CardUsed,
    GameWon,
    CiphersPurchased,
}

impl Space for SocialFeedEventType {
    const INIT_SPACE: usize = 1;
}

#[event]
#[derive(Clone)]
#[derive(InitSpace)]
pub struct SocialFeedEvent {
    pub event_type: SocialFeedEventType,

    #[max_len(100)]
    pub message: String,
    
    pub timestamp: i64,
}