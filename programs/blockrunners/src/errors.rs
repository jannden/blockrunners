use anchor_lang::error_code;

#[error_code]
pub enum BlockRunnersError {
    #[msg("Unknown Error")]
    UnknownError,
}