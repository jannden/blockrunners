use anchor_lang::prelude::*;

use crate::{constants::PLAYER_STATE_SEED, state::PlayerState, utils::randomness_request};

#[derive(Accounts)]
pub struct RandRequest<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    /// CHECK: This account is validated in the instruction handler
    pub randomness_account: AccountInfo<'info>,
}

pub fn temp_rand_request(ctx: Context<RandRequest>) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let randomness_account = &ctx.accounts.randomness_account;

    randomness_request(player_state, randomness_account)?;
    msg!("Randomness requested");

    Ok(())
}
