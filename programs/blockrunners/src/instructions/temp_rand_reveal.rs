use anchor_lang::prelude::*;

use crate::{
    constants::PLAYER_STATE_SEED,
    state::PlayerState,
    utils::{randomness_reveal, randomness_use},
};

#[derive(Accounts)]
pub struct RandReveal<'info> {
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

pub fn temp_rand_reveal(ctx: Context<RandReveal>) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let randomness_account = &ctx.accounts.randomness_account;

    randomness_reveal(player_state, randomness_account)?;
    msg!("Randomness revealed");

    let randomness_value = randomness_use(player_state)?;
    msg!("Randomness value: {}", randomness_value);

    Ok(())
}
