use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

use crate::errors::BlockrunnersError;
use crate::state::PlayerState;

#[cfg(not(feature = "test"))]
pub fn randomness_request(
    player_state: &mut Account<PlayerState>,
    player_randomness: &AccountInfo,
) -> Result<()> {
    // Reset the randomness value to None since we are requesting new randomness
    player_state.randomness_value = None;

    // Parse the randomness account data
    let randomness_data =
        RandomnessAccountData::parse(player_randomness.data.borrow()).map_err(|_| {
            msg!(
                "Failed to parse randomness data for account {}",
                player_randomness.key()
            );
            BlockrunnersError::RandomnessUnavailable
        })?;

    // Get the current clock to verify randomness is committed but not yet revealed
    let clock = Clock::get()?;

    // Check if the randomness seed is available and from the previous slot
    if randomness_data.seed_slot != clock.slot - 1 {
        msg!("seed_slot: {}", randomness_data.seed_slot);
        msg!("slot: {}", clock.slot);
        return Err(BlockrunnersError::RandomnessStale.into());
    }

    // Store slot to verify when using randomness
    player_state.randomness_slot = Some(randomness_data.seed_slot);

    msg!("Randomness request successful");

    Ok(())
}

#[cfg(feature = "test")]
#[allow(unused_variables)]
pub fn randomness_request(
    player_state: &mut Account<PlayerState>,
    _player_randomness: &AccountInfo,
) -> Result<()> {
    msg!("TEST MODE: Running randomness_request");

    let clock = Clock::get()?;
    player_state.randomness_slot = Some(clock.slot - 1);

    Ok(())
}
