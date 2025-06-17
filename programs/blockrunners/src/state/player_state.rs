use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_FEED_EVENTS, MAX_RANDOMNESS_VALUES},
    state::SocialFeedEvent,
};

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Debug, Hash, Eq)]
pub enum Card {
    Shield,
    Doubler,
    Swift,
}

impl Card {
    pub const COUNT: u8 = 3;
}

impl Space for Card {
    const INIT_SPACE: usize = 1;
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum PathDirection {
    Left,
    Right,
}

impl Space for PathDirection {
    const INIT_SPACE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct CardUsage {
    pub shield: bool,
    pub doubler: bool,
    pub swift: bool,
}

impl Space for CardUsage {
    const INIT_SPACE: usize = 3;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct CardCounts {
    pub shield: u8,
    pub doubler: u8,
    pub swift: u8,
}

impl Default for CardCounts {
    fn default() -> Self {
        Self {
            shield: 1,
            doubler: 1,
            swift: 1,
        }
    }
}

impl Space for CardCounts {
    const INIT_SPACE: usize = 3;
}

impl CardCounts {
    /// Get the count for a specific card type
    pub fn get_count(&self, card: Card) -> u8 {
        match card {
            Card::Shield => self.shield,
            Card::Doubler => self.doubler,
            Card::Swift => self.swift,
        }
    }

    /// Add a card to the collection, returns true if successful (not at max)
    pub fn add_card(&mut self, card: Card) -> bool {
        match card {
            Card::Shield => {
                let old_count = self.shield;
                self.shield = self.shield.saturating_add(1);
                old_count < u8::MAX
            }
            Card::Doubler => {
                let old_count = self.doubler;
                self.doubler = self.doubler.saturating_add(1);
                old_count < u8::MAX
            }
            Card::Swift => {
                let old_count = self.swift;
                self.swift = self.swift.saturating_add(1);
                old_count < u8::MAX
            }
        }
    }

    /// Remove a card from the collection, returns true if successful
    pub fn remove_card(&mut self, card: Card) -> bool {
        match card {
            Card::Shield => {
                let old_count = self.shield;
                self.shield = self.shield.saturating_sub(1);
                old_count > 0
            }
            Card::Doubler => {
                let old_count = self.doubler;
                self.doubler = self.doubler.saturating_sub(1);
                old_count > 0
            }
            Card::Swift => {
                let old_count = self.swift;
                self.swift = self.swift.saturating_sub(1);
                old_count > 0
            }
        }
    }

    /// Get the total number of cards
    pub fn total_cards(&self) -> u16 {
        self.shield as u16 + self.doubler as u16 + self.swift as u16
    }

    /// Check if the player has a specific card
    pub fn has_card(&self, card: Card) -> bool {
        self.get_count(card) > 0
    }
}

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    /// Number of ciphers owned
    pub ciphers: u64,

    /// Cards owned - using counts instead of Vec for efficiency
    pub cards: CardCounts,

    /// Current position
    pub position: u8,

    /// Store bump to save compute
    pub bump: u8,

    /// Social feed events history
    #[max_len(MAX_FEED_EVENTS)]
    pub player_events: Vec<SocialFeedEvent>,

    /// Player statistics
    pub first_login: i64,
    pub last_login: i64,
    pub games_won: u64,
    pub total_ciphers_bought: u64,

    /// The Unix timestamp of the game instance this player is part of
    pub game_start: Option<i64>,

    /// Switchboard randomness account for player-specific randomness
    pub randomness_account: Option<Pubkey>,

    /// The slot at which the randomness was committed
    pub randomness_slot: Option<u64>,

    /// The randomness values generated for the player
    #[max_len(MAX_RANDOMNESS_VALUES)]
    pub randomness_value: Option<Vec<u8>>,

    /// Commitment to the move direction
    pub move_direction: Option<PathDirection>,

    /// Commitment to use cards
    pub move_cards: Option<CardUsage>,
}
