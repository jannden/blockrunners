use anchor_lang::prelude::*;

use crate::{
    constants::GAME_STATE_SEED,
    state::GameState,
};

#[derive(Accounts)]
pub struct GetGameState<'info> {
    #[account(
        seeds = [GAME_STATE_SEED],
        bump
    )]
    pub game_state: Account<'info, GameState>,
}

pub fn get_game_state(_ctx: Context<GetGameState>) -> Result<()> {
    // This instruction doesn't modify any state
    // It's used to fetch the game state account
    Ok(())
} 