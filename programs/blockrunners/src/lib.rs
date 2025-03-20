#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod state;
mod instructions;
mod errors;

use instructions::*;

declare_id!("2gt4rq13cxxjWBhfrdA8yXbhTwaqYAettE5rEuquqjgp");

const INITIAL_PRIZE_POOL: u64 = 0;
const INITIAL_PATH_LENGTH: u8 = 20;
const INITIAL_PLAYER_CARDS_AMOUNT: u64 = 1;

#[program]
pub mod blockrunners {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;

        game_state.prize_pool = INITIAL_PRIZE_POOL;
        game_state.path_length = INITIAL_PATH_LENGTH;

        msg!("Game initialized.");
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        ctx.accounts.join_game(&ctx.bumps)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 1, // discriminator + prize_pool + path_length
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameState {
    /// The current prize pool amount in lamports
    pub prize_pool: u64,

    /// The length of the path players need to navigate (fixed at 20 for alpha)
    pub path_length: u8,
}
