use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_STATE_SEED, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    state::{Card, GameState, PlayerState, SocialFeedEventType},
    utils::save_and_emit_event,
};

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut,
      seeds = [PLAYER_STATE_SEED, player.key().as_ref()],
      bump
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(mut,
      seeds = [GAME_STATE_SEED],
      bump
    )]
    pub game_state: Account<'info, GameState>,
}

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let game_state = &mut ctx.accounts.game_state;

    // Don't allow to re-start the current game
    require!(
        player_state.game_start != Some(game_state.start),
        BlockrunnersError::PlayerAlreadyJoinedGame
    );

    save_and_emit_event(
        &mut game_state.game_events,
        SocialFeedEventType::PlayerJoined,
        format!("Player {} joining the game!", ctx.accounts.player.key()),
    )?;

    player_state.game_start = Some(game_state.start);
    player_state.cards = vec![Card::Shield, Card::Doubler, Card::Swift];

    msg!("Player joined the game");
    Ok(())
}
