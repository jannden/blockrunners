#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;

use instructions::*;

declare_id!("BsPD4M38GiLBKuDSNipaw6GCfNeJ3uyRngqYBpsiEXko");

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
}
