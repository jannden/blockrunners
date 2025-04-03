use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use rand_chacha::ChaChaRng;
use rand_core::{RngCore, SeedableRng};
use crate::state::{PlayerState, PathDirection, SocialFeedEventType};
use crate::instructions::save_and_emit_event::save_and_emit_event;

// Function to generate a single random direction
fn generate_next_step(player_state: &Account<PlayerState>) -> PathDirection {
    // Use recent block hash, timestamp, and player's key as sources of randomness
    let recent_slothash = Clock::get().unwrap().slot;
    let recent_timestamp = Clock::get().unwrap().unix_timestamp;
    let mut combined_seed = player_state.key().to_bytes().to_vec();
    combined_seed.extend_from_slice(&recent_slothash.to_le_bytes());
    combined_seed.extend_from_slice(&recent_timestamp.to_le_bytes());
    
    // Hash the combined seed to get a fixed-length seed
    let seed = hash(&combined_seed).to_bytes();
    let mut rng = ChaChaRng::from_seed(seed);

    // Generate a random direction
    match rng.next_u32() % 2 {
        0 => PathDirection::Left,
        1 => PathDirection::Right,
        _ => {
            // this should never happen b/c we mod by 2
            msg!("UNEXPECTED: mod 2 operation produced value other than 0 or 1!");
            PathDirection::Right // Default to right direction as fallback
        }
    }
}

pub fn make_move(ctx: Context<MakeMove>, direction: PathDirection) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    
    let current_position = player_state.position as usize;
    
    // If we need to generate the next step in the path
    if current_position >= player_state.path.len() {
        // Generate the next direction and add it to the path
        let next_direction = generate_next_step(player_state);
        player_state.path.push(next_direction);
        msg!("Generated next direction at position {}", current_position);
    }

    // Now check if the chosen direction matches the path
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
        //   (we should also clear the path,
        //    otherwise the player can just try again and choose the opposite direction)
        player_state.position = 0;
        player_state.path.clear();  // Clear the entire path to start fresh
        
        // Generate just the first step for the new path
        let first_direction = generate_next_step(player_state);
        player_state.path.push(first_direction);
        
        msg!("Incorrect move! Reset to start with a new path");
        
        // Add social feed event for incorrect move
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::PlayerMoved,
            format!("Player made an incorrect move and reset to the start with a new path!"),
        )?;
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    pub player: Signer<'info>,

    #[account(
        mut,
        has_one = player
    )]
    pub player_state: Account<'info, PlayerState>,
}
