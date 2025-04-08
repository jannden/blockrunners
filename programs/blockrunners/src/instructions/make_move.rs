use anchor_lang::prelude::*;
use crate::{
    constants::GAME_STATE_SEED,
    errors::BlockrunnersError,
    instructions::{collect_player_card, save_and_emit_event, generate_next_direction_for_path},
    state::{PathDirection, PlayerState, SocialFeedEventType, GameState}
};

#[derive(Accounts)]
pub struct MakeMove<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub player_state: Account<'info, PlayerState>,

    #[account(
        seeds = [GAME_STATE_SEED],
        bump
    )]
    pub game_state: Account<'info, GameState>,
}

pub fn make_move(ctx: Context<MakeMove>, direction: PathDirection) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let game_state = &ctx.accounts.game_state;

    let current_position = player_state.position as usize;

    // Check if player has already completed the path
    require!(
        player_state.position < game_state.path_length,
        BlockrunnersError::PathAlreadyCompleted
    );
    
    // Generate the correct direction for the current position
    let correct_direction = generate_next_direction_for_path(player_state);
    
    // Check if the chosen direction matches the correct direction
    if direction == correct_direction {
        // Correct move: advance one step
        player_state.position += 1;
        msg!("Correct move! Advanced to position {}", player_state.position);

        // Capture position before mutable borrow
        let new_position = player_state.position;

        // Check if player has reached the end of the path (victory condition)
        if new_position >= game_state.path_length {
            msg!("Congratulations! Player has reached the end of the path and won!");

            save_and_emit_event(
                &mut player_state.player_events,
                SocialFeedEventType::GameWon,
                format!("Player has completed the path and won with {} correct moves!", new_position),
            )?;
        }
        else {
            collect_player_card(player_state)?;

            // Add social feed event for correct move
            save_and_emit_event(
                &mut player_state.player_events,
                SocialFeedEventType::PlayerMoved,
                format!("Player made a correct move and advanced to position {}!", new_position),
            )?;
        }
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
