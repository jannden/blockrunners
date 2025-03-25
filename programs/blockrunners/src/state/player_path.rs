use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerPath {
    pub player: Pubkey,

    #[max_len(20)]
    pub path: Vec<u8>,

    /// Store bump to save compute
    pub bump: u8,
}
