use anchor_lang::prelude::*;

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub enum SocialFeedEventType {
    CardUsed,
    CiphersPurchased,
    GameWon,
    PlayerCardCollected,
    PlayerJoined,
    PlayerCardsMaxRange,
    PlayerMoved,
    ResetAlert,
    MilestoneReached,
    PersonalBest,
    PrizePoolChange,
    PathLengthChange,
    StepPriceChange,
    ConsensusAlert,
    DataBreach,
    SystemIntrusion,
    ProtocolFragment,
}

impl Space for SocialFeedEventType {
    const INIT_SPACE: usize = 1;
}

#[event]
#[derive(Clone, InitSpace)]
pub struct SocialFeedEvent {
    pub event_type: SocialFeedEventType,

    #[max_len(100)]
    pub message: String,

    pub timestamp: i64,
}
