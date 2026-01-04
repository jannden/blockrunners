#![allow(unused_imports)]

use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

use crate::{errors::BlockrunnersError, state::PlayerState};

#[cfg(not(feature = "test"))]
pub fn randomness_reveal(
    player_state: &mut Account<PlayerState>,
    randomness_account: &AccountInfo,
) -> Result<()> {
    // Verify that the randomness account matches the one stored in player_state
    if let Some(randomness_account_key) = player_state.randomness_account {
        require_keys_eq!(
            randomness_account.key(),
            randomness_account_key,
            BlockrunnersError::Unauthorized
        );
    } else {
        // No randomness account stored, this is a state error
        return Err(BlockrunnersError::RandomnessUnavailable.into());
    }

    // Parse the randomness account data
    let randomness_data = RandomnessAccountData::parse(randomness_account.data.borrow())
        .map_err(|_| BlockrunnersError::RandomnessAccountParsingReveal)?;

    // Verify that the randomness slot matches what was stored at request time
    require!(
        Some(randomness_data.seed_slot) == player_state.randomness_slot,
        BlockrunnersError::RandomnessExpired
    );

    let clock = Clock::get()?;

    // Call the switchboard on-demand get_value function to get the revealed random value
    // TODO: Refactor not to store the randomness value in the player state
    player_state.randomness_value = Some(
        randomness_data
            .get_value(clock.slot)
            .map_err(|_| {
                msg!("Randomness not yet resolved");
                BlockrunnersError::RandomnessNotResolved
            })?
            .to_vec(),
    );

    Ok(())
}

#[cfg(feature = "test")]
#[allow(unused_variables)]
pub fn randomness_reveal(
    player_state: &mut Account<PlayerState>,
    randomness_account: &AccountInfo,
) -> Result<()> {
    msg!("TEST MODE: Running randomness_reveal");

    // Verify that the randomness account matches the one stored in player_state
    if let Some(randomness_account_key) = player_state.randomness_account {
        require_keys_eq!(
            randomness_account.key(),
            randomness_account_key,
            BlockrunnersError::Unauthorized
        );
    } else {
        // No randomness account stored, this is a state error
        return Err(BlockrunnersError::RandomnessUnavailable.into());
    }

    // All randomness values are 1 in test mode
    // This means the move is always successful in test mode
    // And the card given is always "Doubler"
    player_state.randomness_value = Some(vec![1; 32]);

    Ok(())
}
