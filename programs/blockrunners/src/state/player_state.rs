use anchor_lang::prelude::*;

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
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
    /// Number of ciphers owned
    pub ciphers: u64,

    /// Number of cards
    // TODO: To be changed to a Cards struct
    pub cards: u64,

    /// Current block number
    pub position: u8,

    #[max_len(20)]
    pub path: Vec<PathDirection>,

    /// Store bump to save compute
    pub bump: u8,
}
