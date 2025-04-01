use anchor_lang::prelude::*;
use crate::state::{PlayerState, PathDirection, SocialFeedEventType};
use crate::errors::BlockrunnersError;
use crate::instructions::save_and_emit_event::save_and_emit_event;

pub fn make_move(ctx: Context<MakeMove>, direction: PathDirection) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    
    let current_position = player_state.position as usize;
    
    // player_state.path will be an array of PathDirection, for example:
    // [Left, Right, Left, Right, Left]

    // Check if player has already completed the path
    require!(
        current_position < player_state.path.len(),
        BlockrunnersError::PathAlreadyCompleted
    );

    // Check if the chosen direction matches the path
    if direction == player_state.path[current_position] {
        // Correct move: advance one step
        player_state.position += 1;
        msg!("Correct move! Advanced to position {}", player_state.position);

        // Capture position before mutable borrow
        let new_position = player_state.position;

        // Add social feed event for correct move
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            format!("Player made a correct move and advanced to position {}!", new_position),
        )?;
    }
    else {
        // Incorrect move: reset to start
        player_state.position = 0;
        msg!("Incorrect move! Reset to start");
        
        // Add social feed event for incorrect move
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            format!("Player made an incorrect move and reset to the start!"),
        )?;
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        constraint = player_state.player == player.key()
    )]
    pub player: Signer<'info>,

    #[account(mut)]
    pub player_state: Account<'info, PlayerState>,
}
