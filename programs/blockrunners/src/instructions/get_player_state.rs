use anchor_lang::prelude::*;

use crate::{
    constants::PLAYER_STATE_SEED,
    state::PlayerState,
};

#[derive(Accounts)]
pub struct GetPlayerState<'info> {
    /// The player whose state we want to retrieve
    pub player: Signer<'info>,

    #[account(
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn get_player_state(_ctx: Context<GetPlayerState>) -> Result<()> {
    // This instruction doesn't modify any state
    // It's used to fetch the player state account
    Ok(())
} 