use anchor_lang::prelude::*;

use crate::{
    state::{GameState, PlayerState, SocialFeedEventType},
    utils::save_and_emit_event,
};

pub fn check_and_award_achievements(
    player_state: &mut Account<PlayerState>,
    game_state: &Account<GameState>,
) -> Result<()> {
    let mut achievement_messages = Vec::new();

    // Ghost Protocol: Win without using any cards
    if !player_state.ghost_protocol && player_state.games_won > 0 {
        // This would need to be tracked per game, simplified for now
        if player_state.shields_used == 0 && player_state.games_won > 0 {
            player_state.ghost_protocol = true;
            achievement_messages.push(
                "ACHIEVEMENT UNLOCKED: Ghost Protocol - Completed a run without detection systems!",
            );
        }
    }

    // Data Hoarder: Collected 100+ cards total
    if !player_state.data_hoarder && player_state.cards_collected >= 100 {
        player_state.data_hoarder = true;
        achievement_messages
            .push("ACHIEVEMENT UNLOCKED: Data Hoarder - Accumulated 100+ protocol fragments!");
    }

    // Consensus Breaker: Reached 90%+ of path length
    let breach_threshold = (game_state.path_length as f32 * 0.9) as u8;
    if !player_state.consensus_breaker && player_state.best_position >= breach_threshold {
        player_state.consensus_breaker = true;
        achievement_messages.push(
            "ACHIEVEMENT UNLOCKED: Consensus Breaker - Penetrated deep into The Consensus network!",
        );
    }

    // Cipher Lord: Purchased 1000+ ciphers total
    if !player_state.cipher_lord && player_state.total_ciphers_bought >= 1000 {
        player_state.cipher_lord = true;
        achievement_messages.push("ACHIEVEMENT UNLOCKED: Cipher Lord - Mastered the art of computational resource acquisition!");
    }

    // System Breach milestone (50%+ of path)
    let system_breach_threshold = (game_state.path_length as f32 * 0.5) as u8;
    if player_state.position >= system_breach_threshold {
        player_state.system_breaches += 1;

        let breach_message = format!(
            "SYSTEM INTRUSION: Breached {}% of network defenses. Security protocols adapting...",
            (player_state.position as f32 / game_state.path_length as f32 * 100.0) as u8
        );
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::SystemIntrusion,
            breach_message,
        )?;
    }

    // Emit achievement notifications
    for message in achievement_messages {
        save_and_emit_event(
            &mut player_state.player_events,
            SocialFeedEventType::ProtocolFragment,
            message.to_owned(),
        )?;
    }

    Ok(())
}

pub fn check_milestones(
    player_state: &Account<PlayerState>,
    game_state: &mut Account<GameState>,
) -> Result<()> {
    let progress_percentage =
        (player_state.position as f32 / game_state.path_length as f32 * 100.0) as u8;

    // Notable milestone checkpoints
    let milestones = [25, 50, 75, 90];

    for &milestone in milestones.iter() {
        if progress_percentage >= milestone && progress_percentage < milestone + 5 {
            let milestone_message = format!(
                "CRITICAL: Runner at {}% proximity to protocol recovery point. Consensus defenses intensifying.",
                milestone
            );

            save_and_emit_event(
                &mut game_state.game_events,
                SocialFeedEventType::MilestoneReached,
                milestone_message,
            )?;
            break;
        }
    }

    Ok(())
}
