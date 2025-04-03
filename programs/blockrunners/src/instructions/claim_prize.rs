use anchor_lang::prelude::*;

use crate::{
    constants::INITIAL_PATH_LENGTH,
    errors::BlockrunnersError,
    state::{GameState, PlayerState},
};

pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
    let game_state = &mut ctx.accounts.game_state;

    // Check if player has reached the end
    let player_state = &ctx.accounts.player_state;
    // require!(
    //     player_state.position as u8 >= game_state.path_length,
    //     BlockrunnersError::PlayerNotAtEnd
    // );

    // Get the prize amount
    let prize_amount = game_state.prize_pool;
    // require!(prize_amount > 0, BlockrunnersError::NoPrize);

    // Reset prize pool
    game_state.prize_pool = 0;

    // Transfer the prize to the player
    **game_state.to_account_info().try_borrow_mut_lamports()? = game_state
        .to_account_info()
        .lamports()
        .checked_sub(prize_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    **ctx.accounts.player.try_borrow_mut_lamports()? = ctx
        .accounts
        .player
        .lamports()
        .checked_add(prize_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // After transferring prize and resetting prize pool:
    game_state.prize_pool = 0;

    // Reset game for new cycle - you could adjust path_length here if desired
    game_state.path_length = INITIAL_PATH_LENGTH;

    msg!("Player claimed prize of {} lamports", prize_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"player_state", player.key().as_ref()],
        bump = player_state.bump
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,
}
