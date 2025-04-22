use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_STATE_SEED, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{CardUsage, GameState, PathDirection, PlayerState},
    utils::{get_move_cost, randomness_request},
};

#[derive(Accounts)]
pub struct MoveCommit<'info> {
    pub player: Signer<'info>,

    #[account(mut,
        seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(
      seeds = [GAME_STATE_SEED],
      bump
    )]
    pub game_state: Account<'info, GameState>,

    /// CHECK: This account is validated in the instruction handler
    #[account()]
    pub randomness_account: AccountInfo<'info>,
}

pub fn move_commit(
    ctx: Context<MoveCommit>,
    direction: PathDirection,
    card_usage: CardUsage,
) -> Result<()> {
    let game_state = &ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;
    let randomness_account = &ctx.accounts.randomness_account;

    update_last_login(player_state)?;

    // Check if player is part of the current game
    require!(
        player_state.game_start == Some(game_state.start),
        BlockrunnersError::PlayingInDifferentGame
    );

    // Check if player has already completed the path
    require!(
        player_state.position < game_state.path_length,
        BlockrunnersError::PathAlreadyCompleted
    );

    // Check if player has enough ciphers to pay for the move
    let total_cost = get_move_cost(player_state, &card_usage)?;
    require!(
        player_state.ciphers >= total_cost,
        BlockrunnersError::InsufficientBalance
    );

    // Save commitment
    player_state.move_direction = Some(direction);
    player_state.move_cards = Some(card_usage);

    // Request randomness
    randomness_request(player_state, randomness_account)?;

    Ok(())
}
