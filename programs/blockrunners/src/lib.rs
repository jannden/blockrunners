use anchor_lang::prelude::*;

declare_id!("D3Z8EKaXQssyvFBcVLuSPnj5xVywsxCujqd9wxgbuEkU");

#[program]
pub mod blockrunners {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
