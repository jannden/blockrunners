use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::{CIPHER_COST, GAME_STATE_SEED, PLAYER_STATE_SEED, PRIZE_POOL_PERCENTAGE},
    errors::BlockrunnersError,
    instructions::update_last_login,
    state::{GameState, PlayerState, SocialFeedEventType},
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

    /// CHECK: This is the admin wallet that receives the admin share
    #[account(mut, address = game_state.authority)]
    pub admin_wallet: SystemAccount<'info>,

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

    // Calculate revenue distribution
    let prize_pool_amount = cost
        .checked_mul(PRIZE_POOL_PERCENTAGE as u64)
        .ok_or(ProgramError::ArithmeticOverflow)?
        / 100;
    let admin_amount = cost - prize_pool_amount; // Ensures no rounding loss

    // Transfer prize pool portion to the game state
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.player.to_account_info(),
            to: game_state.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, prize_pool_amount)?;

    // Transfer admin portion directly to admin wallet
    if admin_amount > 0 {
        let cpi_context_admin = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.admin_wallet.to_account_info(),
            },
        );
        system_program::transfer(cpi_context_admin, admin_amount)?;
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

    let old_prize_pool = game_state.prize_pool;

    // Update prize pool
    game_state.prize_pool = game_state
        .prize_pool
        .checked_add(prize_pool_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // Check for significant prize pool increases (>10% increase)
    if old_prize_pool > 0 {
        let increase_percentage =
            ((prize_pool_amount as f64 / old_prize_pool as f64) * 100.0) as u64;
        if increase_percentage >= 10 {
            let pool_message = format!(
                "FUNDING SURGE: Protocol recovery fund increased by {}% to {} lamports. Mission priority escalating.",
                increase_percentage,
                game_state.prize_pool
            );
            save_and_emit_event(
                &mut game_state.game_events,
                SocialFeedEventType::PrizePoolChange,
                pool_message,
            )?;
        }
    }

    // Announce to player's feed
    let private_message = format!(
        "RESOURCES ACQUIRED: {} computational ciphers purchased for {} lamports. Your current reserves: {}",
        amount, cost, player_state.ciphers
    );
    save_and_emit_event(
        &mut player_state.player_events,
        SocialFeedEventType::CiphersPurchased,
        private_message,
    )?;

    // Check if player achieved Cipher Lord status
    if player_state.total_ciphers_bought >= 1000 && !player_state.cipher_lord {
        player_state.cipher_lord = true;
        let achievement_message =
            "ACHIEVEMENT UNLOCKED: Cipher Lord - Mastered computational resource acquisition!";
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::ProtocolFragment,
            achievement_message.to_string(),
        )?;
    }

    Ok(())
}
