#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

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
        let player_state = &mut ctx.accounts.player_state;

        player_state.ciphers = 0;
        player_state.cards = INITIAL_PLAYER_CARDS_AMOUNT; // Start with 1 card
        player_state.position = 0;

        msg!("Player joined the game.");
        Ok(())
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

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 1, // discriminator + ciphers + cards + position
        seeds = [b"player_state", authority.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameState {
    /// The current prize pool amount in lamports
    pub prize_pool: u64,

    /// The length of the path players need to navigate (fixed at 20 for alpha)
    pub path_length: u8,
}

#[account]
pub struct PlayerState {
    /// Number of ciphers owned
    pub ciphers: u64,

    /// Number of cards 
    pub cards: u64,

    /// Current block number (fixed at 20 for alpha)
    pub position: u8,
}