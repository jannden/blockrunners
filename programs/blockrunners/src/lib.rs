#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;
mod utils;
use instructions::*;
use state::{Card, CardUsage, PathDirection};

declare_id!("4daaULsebqDAFfASzX1YoTwF1rn4ZMxKdfLtLKfyjwcE");

#[program]
pub mod blockrunners {

    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        initialize_game::initialize_game(ctx)
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        initialize_player::initialize_player(ctx)
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        join_game::join_game(ctx)
    }

    pub fn purchase_ciphers(ctx: Context<PurchaseCiphers>, amount: u64) -> Result<()> {
        purchase_ciphers::purchase_ciphers(ctx, amount)
    }

    pub fn move_commit(
        ctx: Context<MoveCommit>,
        direction: PathDirection,
        card_usage: CardUsage,
    ) -> Result<()> {
        move_commit::move_commit(ctx, direction, card_usage)
    }

    pub fn move_reveal(ctx: Context<MoveReveal>) -> Result<()> {
        move_reveal::move_reveal(ctx)
    }

    #[cfg(feature = "test")]
    pub fn debug_give_card(ctx: Context<DebugGiveCard>, card: Card) -> Result<()> {
        debug_give_card::debug_give_card(ctx, card)
    }
}
