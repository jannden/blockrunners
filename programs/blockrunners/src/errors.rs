use anchor_lang::error_code;

#[error_code]
pub enum BlockrunnersError {
    #[msg("Player used too many cards")]
    ExceedsMaxCards,

    #[msg("Player used duplicate card")]
    DuplicateCard,

    #[msg("Player has insufficient balance to pay")]
    InsufficientBalance,

    #[msg("Player tried to use a card they don't have")]
    InsufficientCards,

    #[msg("Invalid card index generated")]
    InvalidCardIndex,

    #[msg("Player tries to purchase ciphers with a negative amount")]
    NegativeCiphersAmount,

    #[msg("Player has already completed the path")]
    PathAlreadyCompleted,

    #[msg("Arithmetic overflow occurred during calculation")]
    ArithmeticOverflow,

    #[msg("Unknown Error")]
    UnknownError,

    #[msg("No cards left to use")]
    NoCardsLeft,

    #[msg("Invalid move")]
    InvalidMove,

    #[msg("Invalid card selection")]
    InvalidCardSelection,

    #[msg("Not enough ciphers to make this move")]
    NotEnoughCiphers,

    #[msg("Player not at end of path yet")]
    NotAtEndOfPath,

    #[msg("Failed to parse randomness account")]
    RandomnessAccountParsing,

    #[msg("Failed to parse randomness account for reveal")]
    RandomnessAccountParsingReveal,

    #[msg("Randomness data is unavailable")]
    RandomnessUnavailable,

    #[msg("Randomness finished")]
    RandomnessFinished,

    #[msg("Randomness not resolved")]
    RandomnessNotResolved,

    #[msg("Randomness is stale")]
    RandomnessStale,

    #[msg("Randomness is expired")]
    RandomnessExpired,

    #[msg("Unauthorized")]
    Unauthorized,
}
