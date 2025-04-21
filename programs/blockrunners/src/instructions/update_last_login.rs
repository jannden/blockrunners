use anchor_lang::prelude::*;
use crate::state::PlayerState;

pub fn update_last_login(player_state: &mut PlayerState) -> Result<()> {
    let clock = Clock::get()?;
    player_state.last_login = clock.unix_timestamp;
    Ok(())
}
