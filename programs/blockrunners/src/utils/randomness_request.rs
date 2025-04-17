use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

use crate::errors::BlockrunnersError;
use crate::state::PlayerState;

#[cfg(any(not(test), rust_analyzer))]
pub fn randomness_request(
    player_state: &mut Account<PlayerState>,
    player_randomness: &AccountInfo,
) -> Result<()> {
    // Parse the randomness account data
    let randomness_data =
        RandomnessAccountData::parse(player_randomness.data.borrow()).map_err(|_| {
            msg!("Failed to parse randomness data");
            BlockrunnersError::RandomnessUnavailable
        })?;

    // Get the current clock to verify randomness is resolved
    let clock = Clock::get()?;

    // Check if the randomness is not stale
    if randomness_data.seed_slot != clock.slot - 1 {
        msg!("seed_slot: {}", randomness_data.seed_slot);
        msg!("slot: {}", clock.slot);
        return Err(BlockrunnersError::RandomnessStale.into());
    }

    // Prevent multiple requests
    player_state.randomness_slot = Some(randomness_data.seed_slot);

    // Prevent randomness account injection
    player_state.randomness_account = player_randomness.key();

    msg!("Randomness request successful");

    Ok(())
}

#[cfg(all(test, not(rust_analyzer)))]
#[allow(unused_variables)]
pub fn randomness_request(
    player_state: &Account<PlayerState>,
    player_randomness: &AccountInfo,
) -> Result<()> {
    Ok(())
}
