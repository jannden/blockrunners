use anchor_lang::prelude::*;

use crate::{state::PlayerState, INITIAL_PLAYER_CARDS_AMOUNT};

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE, // discriminator + ciphers + cards + position
        seeds = [b"player_state", player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}

impl JoinGame<'_> {
    pub fn join_game(&mut self, bumps: &JoinGameBumps) -> Result<()> {
        self.player_state.set_inner(PlayerState {
            ciphers: 0,
            cards: INITIAL_PLAYER_CARDS_AMOUNT, // Start with 1 card
            position: 0,
            bump: bumps.player_state,
        });

        msg!("Player joined the game.");
        Ok(())
    }
}