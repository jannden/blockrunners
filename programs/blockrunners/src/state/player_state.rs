use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    /// Number of ciphers owned
    pub ciphers: u64,

    /// Number of cards 
    pub cards: u64,

    /// Current block number (fixed at 20 for alpha)
    pub position: u8,

    pub bump: u8,
}