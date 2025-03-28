#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;

use instructions::*;

declare_id!("8mUsmUoGDePRR51MkZBLTM2Pgx28zRewWgpC38F2c5pV");

#[program]
pub mod blockrunners {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        initialize_game::initialize_game(ctx)
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        initialize_player::initialize_player(ctx)
    }

    pub fn purchase_ciphers(ctx: Context<PurchaseCiphers>, amount: u64) -> Result<()> {
        purchase_ciphers::purchase_ciphers(ctx, amount)
    }

    pub fn get_game_state(ctx: Context<GetGameState>) -> Result<()> {
        get_game_state::get_game_state(ctx)
    }

    pub fn get_player_state(ctx: Context<GetPlayerState>) -> Result<()> {
        get_player_state::get_player_state(ctx)
    }
}
