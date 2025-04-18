use anchor_lang::prelude::*;

use crate::{
    constants::PLAYER_STATE_SEED,
    state::{Card, PlayerState},
};

#[derive(Accounts)]
pub struct DebugGiveCard<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn debug_give_card(ctx: Context<DebugGiveCard>, card: Card) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    player_state.cards.push(card);

    Ok(())
}
