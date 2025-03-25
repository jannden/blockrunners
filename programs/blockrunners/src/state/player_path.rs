use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerPath {
    pub player: Pubkey,

    // TODO: Create enum for Left = 0 and Right = 1
    #[max_len(20)]
    pub path: Vec<u8>,

    /// Store bump to save compute
    pub bump: u8,
}