use anchor_lang::prelude::*;

use crate::{
    constants::{
        DISCRIMINATOR_SIZE, 
        PLAYER_STATE_SEED
    }, 
    instructions::update_last_login,
    state::PlayerState
};

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init,
        payer = player,
        space = usize::from(DISCRIMINATOR_SIZE) + PlayerState::INIT_SPACE,
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let clock = Clock::get()?;

    // Initialize player state with default values
    player_state.player = *ctx.accounts.player.key;
    player_state.ciphers = 0;
    player_state.cards = Vec::new();
    player_state.position = 0;
    player_state.bump = ctx.bumps.player_state;
    player_state.player_events = Vec::new();
    player_state.in_game = false;

    // Initialize player statistics
    player_state.first_login = clock.unix_timestamp;
    player_state.games_played = 0;
    player_state.total_ciphers_bought = 0;
    
    // Set last_login using the utility function
    update_last_login(player_state)?;

    msg!("Player initialized");
    Ok(())
}
