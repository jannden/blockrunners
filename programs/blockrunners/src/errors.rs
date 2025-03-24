use anchor_lang::error_code;

#[error_code]
pub enum BlockrunnersError {
    #[msg("Player has insufficient balance to pay for ciphers")]
    InsufficientBalance,

    #[msg("Player tries to purchase ciphers with a negative amount")]
    NegativeCiphersAmount,

    #[msg("Unknown Error")]
    UnknownError,
}
