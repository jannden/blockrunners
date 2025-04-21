use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::{CIPHER_COST, GAME_STATE_SEED, PLAYER_STATE_SEED},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{Card, GameState, PlayerState, SocialFeedEventType},
    utils::save_and_emit_event,
};

#[derive(Accounts)]
pub struct PurchaseCiphers<'info> {
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

    pub system_program: Program<'info, System>,
}

pub fn purchase_ciphers(ctx: Context<PurchaseCiphers>, amount: u64) -> Result<()> {
    let player_state = &mut ctx.accounts.player_state;
    let game_state = &mut ctx.accounts.game_state;

    // Check if amount is positive
    require!(amount > 0, BlockrunnersError::NegativeCiphersAmount);

    update_last_login(player_state)?;

    // Calculate cost in lamports
    let cost = amount * CIPHER_COST;

    // Check if player has enough balance
    require!(
        ctx.accounts.player.lamports() >= cost,
        BlockrunnersError::InsufficientBalance
    );

    // Transfer SOL from player to the program
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.player.to_account_info(),
            to: game_state.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, cost)?;

    // Check if the player is not already in the game
    if !player_state.in_game {
        save_and_emit_event(
            &mut game_state.game_events,
            SocialFeedEventType::PlayerJoined,
            format!("Player {} joining the game!", ctx.accounts.player.key()),
        )?;

        player_state.in_game = true;
        player_state.cards = vec![Card::Shield, Card::Doubler, Card::Swift]
    }

    // Update player's cipher count
    player_state.ciphers = player_state
        .ciphers
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    player_state.total_ciphers_bought = player_state
        .total_ciphers_bought
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // Update prize pool
    game_state.prize_pool = game_state
        .prize_pool
        .checked_add(cost)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::CiphersPurchased,
        format!("You have successfully purchased {} for {}!", amount, cost),
    )?;

    msg!("Purchased {} ciphers for {} lamports", amount, cost);
    Ok(())
}
