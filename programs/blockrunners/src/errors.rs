use anchor_lang::error_code;

#[error_code]
pub enum BlockrunnersError {
    #[msg("Player has insufficient balance to pay for ciphers")]
    InsufficientBalance,

    #[msg("Invalid card index generated")]
    InvalidCardIndex,

    #[msg("Player tries to purchase ciphers with a negative amount")]
    NegativeCiphersAmount,

    #[msg("Player has already completed the path")]
    PathAlreadyCompleted,

    #[msg("Unknown Error")]
    UnknownError,
}
