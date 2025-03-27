use anchor_lang::prelude::*;

use crate::{
    constants::{DISCRIMINATOR_SIZE, SOCIAL_FEED_SEED},
    state::SocialFeed,
};

#[derive(Accounts)]
pub struct InitializeSocialFeed<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = usize::from(DISCRIMINATOR_SIZE) + SocialFeed::INIT_SPACE,
        seeds = [SOCIAL_FEED_SEED],
        bump
    )]
    pub social_feed: Account<'info, SocialFeed>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_social_feed(ctx: Context<InitializeSocialFeed>) -> Result<()> {
    let social_feed = &mut ctx.accounts.social_feed;

    social_feed.authority = ctx.accounts.admin.key();
    social_feed.events = Vec::new();
    social_feed.bump = ctx.bumps.social_feed;

    msg!("Social feed initialized");
    Ok(())
} 