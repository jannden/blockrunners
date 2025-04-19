use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

use crate::errors::BlockrunnersError;
use crate::state::PlayerState;

#[cfg(not(feature = "test"))]
pub fn randomness_request(
    player_state: &mut Account<PlayerState>,
    randomness_account: &AccountInfo,
) -> Result<()> {
    // Save randomness account to verify later
    player_state.randomness_account = Some(randomness_account.key());

    // Reset the randomness values without removing the account reference
    player_state.randomness_value = None;

    // Parse the randomness account data
    let randomness_data = RandomnessAccountData::parse(randomness_account.data.borrow())
        .map_err(|_| BlockrunnersError::RandomnessAccountParsing)?;

    // TODO ??? Error if randomness_data.seed_slot != clock.slot - 1
    let clock = Clock::get()?;
    msg!("seed_slot: {}", randomness_data.seed_slot);
    msg!("slot: {}", clock.slot);

    // Store the seed slot when the randomness was committed
    player_state.randomness_slot = Some(randomness_data.seed_slot);

    msg!(
        "Randomness request successful - slot: {}",
        randomness_data.seed_slot
    );

    Ok(())
}

#[cfg(feature = "test")]
#[allow(unused_variables)]
pub fn randomness_request(
    player_state: &mut Account<PlayerState>,
    randomness_account: &AccountInfo,
) -> Result<()> {
    msg!("TEST MODE: Running randomness_request");

    let clock = Clock::get()?;
    player_state.randomness_slot = Some(clock.slot - 1);
    player_state.randomness_account = Some(randomness_account.key());

    Ok(())
}
