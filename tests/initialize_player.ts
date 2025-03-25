import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { 
  GAME_STATE_SEED, 
  PLAYER_STATE_SEED, 
  PLAYER_PATH_SEED,
  INITIAL_PATH_LENGTH
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

    // Player path PDA
    const [playerPathPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_PATH_SEED), playerKeypair.publicKey.toBuffer()],
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
    expect(playerState.cards.toNumber()).to.equal(1); // Start with 1 card
    expect(playerState.position).to.equal(0); // Start at position 0

    // Fetch player path state to verify initialization
    const playerPathState = await program.account.playerPath.fetch(playerPathPda);

    // Verify player has the correct path length
    expect(playerPathState.path.length).to.equal(INITIAL_PATH_LENGTH);
  });

  it("Verifies unique paths for different players", async () => {
    const player1Keypair = Keypair.generate();
    const player2Keypair = Keypair.generate();

    await airdropSol(provider, player1Keypair);
    await airdropSol(provider, player2Keypair);

    const [player1PathPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_PATH_SEED), player1Keypair.publicKey.toBuffer()],
      program.programId
    );
    const [player2PathPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_PATH_SEED), player2Keypair.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializePlayer()
      .accounts({
        player: player1Keypair.publicKey,
      })
      .signers([player1Keypair])
      .rpc();

      await program.methods
      .initializePlayer()
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();

    const player1PathState = await program.account.playerPath.fetch(player1PathPda);
    const player2PathState = await program.account.playerPath.fetch(player2PathPda);

    expect(player1PathState.path).to.not.deep.equal(player2PathState.path);

    console.log("Player 1 path: ", Array.from(player1PathState.path));
    console.log("Player 2 path: ", Array.from(player2PathState.path));
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
