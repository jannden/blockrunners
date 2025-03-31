use anchor_lang::prelude::*;
use crate::state::{PlayerState, PathDirection};
use crate::errors::ErrorCode;

pub fn make_move(ctx: Context<MakeMove>, direction: PathDirection) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    
    let current_position = player_state.position as usize;
    
    // player_state.path will be an array of PathDirection, for example:
    // [Left, Right, Left, Right, Left]
    if direction == player_state.path[current_position] {
        // Correct move: advance one step
        player_state.position += 1;
        msg!("Correct move! Advanced to position {}", player_state.position);
    } else {
        // Incorrect move: reset to start
        player_state.position = 0;
        msg!("Incorrect move! Reset to start");
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(
        constraint = player_state.player == player.key()
    )]
    pub player: Signer<'info>,
}