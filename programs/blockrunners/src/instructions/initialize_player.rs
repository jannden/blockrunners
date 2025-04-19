use anchor_lang::prelude::*;

use crate::{
    constants::{DISCRIMINATOR_SIZE, PLAYER_STATE_SEED},
    instructions::update_last_login,
    state::{Card, PlayerState},
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
    player_state.ciphers = 0;
    player_state.cards = vec![Card::Shield, Card::Doubler, Card::Swift]; // TODO: Implement default for cards
    player_state.position = 0;
    player_state.bump = ctx.bumps.player_state;
    player_state.player_events = Vec::new();
    player_state.in_game = false;

    // Initialize game start time
    player_state.game_start = ctx.accounts.game_state.start;

    // Initialize player statistics
    player_state.first_login = clock.unix_timestamp;
    player_state.games_won = 0;
    player_state.total_ciphers_bought = 0;
    update_last_login(player_state)?;

    player_state.randomness_account = None;
    player_state.randomness_slot = None;
    player_state.randomness_value = None;
    player_state.move_direction = None;
    player_state.move_cards = None;

    msg!("Player initialized");

    Ok(())
}
