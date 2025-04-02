import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { 
  GAME_STATE_SEED, 
  PLAYER_STATE_SEED, 
} from "./helpers/constants";
import { airdropSol, getMsgLogs } from "./helpers/utils";

describe("Initialize Player", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Keypairs
  const adminKeypair = Keypair.generate();
  const playerKeypair = Keypair.generate();

  // Game state PDA
  const [gameStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(GAME_STATE_SEED)],
    program.programId
  );

  // Player state PDA
  const [playerStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PLAYER_STATE_SEED), playerKeypair.publicKey.toBuffer()],
    program.programId
  );

  before(async () => {
    // Airdrop SOL to the admin and player
    await airdropSol(provider, adminKeypair);
    await airdropSol(provider, playerKeypair);

    // Initialize the game if not already initialized
    const gameState = await program.account.gameState.fetchNullable(gameStatePda);
    if (!gameState) {
      const initTx = await program.methods
        .initializeGame()
        .accounts({
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("Game initialization transaction signature", initTx);
    }
  });

  it("Allows a player to initialize their player state", async () => {
    // Get player balance before initialization
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);

    // Initialize the player
    const tx = await program.methods
      .initializePlayer()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const logs = await getMsgLogs(provider, tx);
    console.log("Player initialization logs -> ", logs);

    // Get player balance after initialization
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);

    // Fetch player state to verify initialization
    const playerState = await program.account.playerState.fetch(playerStatePda);

    // Verify player state was initialized correctly
    expect(playerState.ciphers.toNumber()).to.equal(0); // Start with 0 ciphers
    expect(playerState.position).to.equal(0); // Start at position 0
  });

  it("Fails if player state account already exists", async () => {
    try {
      await program.methods
        .initializePlayer()
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.transactionLogs[3]).to.include("already in use");
    }
  });
});
