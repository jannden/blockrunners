import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";

describe("blockrunners", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider();
  
  // Fixed path length for alpha
  const PATH_LENGTH = 20;
  
  // Game state PDA
  const [gameStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game_state")],
    program.programId
  );

  it("Initializes the game state", async () => {
    // Initialize the game with the specified path length
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: provider.publicKey,
      })
      .rpc();
    
    console.log("Transaction signature", tx);
    
    // Fetch the game state to verify initialization
    const gameState = await program.account.gameState.fetch(gameStatePda);
    
    // Verify game state values
    expect(gameState.prizePool.toNumber()).to.equal(0);
    expect(gameState.pathLength).to.equal(PATH_LENGTH);
  });

  it("Initializes the player state", async () => {
    const [playerStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_state"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Initialize the player with the specified card amount
    const tx = await program.methods
      .joinGame()
      .accounts({
        player: provider.publicKey,
      })
      .rpc();
    
    console.log("Transaction signature", tx);
    
    // Fetch the player state to verify initialization
    const playerState = await program.account.playerState.fetch(playerStatePda);
    
    // Verify player state values
    expect(playerState.ciphers.toNumber()).to.equal(0);
    expect(playerState.cards.toNumber()).to.equal(1);
    expect(playerState.position).to.equal(0);
  });
});
