use anchor_lang::prelude::*;

use crate::{errors::BlockrunnersError, state::PlayerState};

pub fn randomness_use(player_state: &mut Account<PlayerState>) -> Result<u8> {
    let clock = Clock::get()?;
    let requested_slot = player_state
        .randomness_slot
        .ok_or(BlockrunnersError::RandomnessNotResolved)?;

    // TODO: ? Verify that the current slot matches what was stored at request time
    msg!("Randomness requested at slot: {}", requested_slot);
    msg!("Clock slot: {}", clock.slot);

    let randomness_values = player_state
        .randomness_value
        .as_mut()
        .ok_or(BlockrunnersError::RandomnessNotResolved)?;

    // Verify there are enough values
    require!(
        randomness_values.len() >= 1,
        BlockrunnersError::RandomnessFinished
    );

    // Get and remove the first value
    let first_value = randomness_values.swap_remove(0);

    Ok(first_value)
}
