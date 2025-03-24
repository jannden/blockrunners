use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameState {
    /// Authority
    pub authority: Pubkey,

    /// The current prize pool amount in lamports
    pub prize_pool: u64,

    /// The length of the path players need to navigate
    pub path_length: u8,
}
