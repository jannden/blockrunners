use anchor_lang::prelude::*;

use crate::{
    constants::SOCIAL_FEED_SEED,
    state::SocialFeed,
};

#[derive(Accounts)]
pub struct GetSocialFeed<'info> {
    #[account(
        seeds = [SOCIAL_FEED_SEED],
        bump
    )]
    pub social_feed: Account<'info, SocialFeed>,
}

pub fn get_social_feed(_ctx: Context<GetSocialFeed>) -> Result<()> {
    // This instruction doesn't modify any state
    // It's used to fetch the social feed account
    Ok(())
} 