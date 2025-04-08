use anchor_lang::prelude::*;

use crate::{
    constants::{
        DISCRIMINATOR_SIZE, 
        PLAYER_STATE_SEED
    }, 
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

    // Initialize player state with default values
    player_state.player = *ctx.accounts.player.key;
    player_state.ciphers = 0;
    player_state.cards = Vec::new();
    player_state.position = 0;
    player_state.bump = ctx.bumps.player_state;
    player_state.player_events = Vec::new();
    player_state.in_game = false;

    msg!("Player initialized");
    Ok(())
}
