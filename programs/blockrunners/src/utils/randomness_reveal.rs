use anchor_lang::prelude::*;
use switchboard_on_demand::accounts::RandomnessAccountData;

use crate::{errors::BlockrunnersError, state::PlayerState};

#[cfg(any(not(test), rust_analyzer))]
pub fn randomness_reveal(
    player_state: &Account<PlayerState>,
    player_randomness: &AccountInfo,
) -> Result<bool> {
    // Verify that the randomness account matches the one stored in player_state
    if player_randomness.key() != player_state.randomness_account {
        return Err(BlockrunnersError::Unauthorized.into());
    }

    // Parse the randomness account data
    let randomness_data = RandomnessAccountData::parse(player_randomness.data.borrow()).unwrap();

    // Verify that the randomness is not stale
    if Some(randomness_data.seed_slot) != player_state.randomness_slot {
        return Err(BlockrunnersError::RandomnessExpired.into());
    }

    let clock = Clock::get()?;

    // Call the switchboard on-demand get_value function to get the revealed random value
    let revealed_random_value = randomness_data.get_value(&clock).map_err(|_| {
        msg!("Randomness not yet resolved");
        error!(BlockrunnersError::RandomnessNotResolved)
    })?;

    // Use the revealed random value to determine the flip results
    let randomness_result = revealed_random_value[0] % 2 == 0;

    Ok(randomness_result)
}

#[cfg(all(test, not(rust_analyzer)))]
#[allow(unused_variables)]
pub fn randomness_reveal(
    player_state: &Account<PlayerState>,
    player_randomness: &AccountInfo,
) -> Result<bool> {
    Ok(true)
}
