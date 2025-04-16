use anchor_lang::prelude::*;
use strum::EnumCount;

use crate::{
    constants::PLAYER_STATE_SEED,
    errors::BlockrunnersError,
    instructions::update_last_login,
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
    
    update_last_login(player_state)?;
    
    player_state.cards.push(card);

    Ok(())
}
