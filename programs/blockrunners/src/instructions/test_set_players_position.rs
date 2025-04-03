use anchor_lang::prelude::*;

use crate::state::PlayerState;

// This function is only for testing purposes
pub fn test_set_player_position(ctx: Context<TestSetPlayerPosition>, position: u8) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    player_state.position = position;

    msg!("Test: Set player position to {}", position);
    Ok(())
}

#[derive(Accounts)]
pub struct TestSetPlayerPosition<'info> {
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"player_state", player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
}
