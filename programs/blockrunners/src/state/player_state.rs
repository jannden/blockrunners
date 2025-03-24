use anchor_lang::prelude::*;

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

    /// Store bump to save compute
    pub bump: u8,
}
