use anchor_lang::prelude::*;

use crate::{
  constants::MAX_FEED_EVENTS, 
  state::{SocialFeedEvent, SocialFeedEventType}
};

pub fn save_and_emit_event (
  events: &mut Vec<SocialFeedEvent>,
  event_type: SocialFeedEventType,
  message: String,
) -> Result<()> {
    let clock = Clock::get()?; // Get the current timestamp

    // Limit the feed to the latest 20 events
    if events.len() >= usize::from(MAX_FEED_EVENTS) {
      events.remove(0); // Remove the oldest event
    }

    // Add the new event
    let new_event = SocialFeedEvent {
        message,
        event_type,
        timestamp: clock.unix_timestamp,
    };

    emit!(new_event);

    events.push(new_event);

    msg!("New social feed event emitted");
    Ok(())
}
