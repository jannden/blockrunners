use anchor_lang::prelude::*;

use crate::{
    constants::{DISCRIMINATOR_SIZE, GAME_STATE_SEED, INITIAL_PATH_LENGTH, INITIAL_PRIZE_POOL},
    state::GameState,
};

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = usize::from(DISCRIMINATOR_SIZE) + GameState::INIT_SPACE,
        seeds = [GAME_STATE_SEED],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
    let game_state = &mut ctx.accounts.game_state;

    // tommy: get current time for initial game start in initialize_game function
    let clock = Clock::get()?;

    game_state.authority = ctx.accounts.admin.key();
    game_state.prize_pool = INITIAL_PRIZE_POOL;
    game_state.path_length = INITIAL_PATH_LENGTH;
    game_state.start = clock.unix_timestamp;
    game_state.game_events = Vec::new();

    msg!("Game initialized by admin");
    Ok(())
}
