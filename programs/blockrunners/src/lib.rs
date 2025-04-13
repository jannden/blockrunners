#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;

use instructions::*;
use state::{Card, PathDirection};

declare_id!("9BRKKfPZ9kXT8KdMbCmvjnTFqec57ExLRdgUsCNqWU7P");

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

    pub fn make_move(
        ctx: Context<MakeMove>,
        direction: PathDirection,
        card_usage: CardUsage,
    ) -> Result<()> {
        make_move::make_move(ctx, direction, card_usage)
    }

    #[cfg(feature = "test")]
    pub fn debug_give_card(ctx: Context<DebugGiveCard>, card: Card) -> Result<()> {
        debug_give_card::debug_give_card(ctx, card)
    }
}
