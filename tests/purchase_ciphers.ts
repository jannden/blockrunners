import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, INITIAL_PATH_LENGTH, PLAYER_STATE_SEED } from "./helpers/constants";
import { airdropSol, getMsgLogs } from "./helpers/utils";

describe("Purchase ciphers", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Fixed cipher cost for alpha
  const CIPHER_COST = LAMPORTS_PER_SOL / 1000;

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
      const initGameTx = await program.methods
        .initializeGame()
        .accounts({
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("Game initialization transaction signature", initGameTx);
    }

    // Initialize player state
    const initPlayerTx = await program.methods
      .initializePlayer()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log("Player initialization transaction signature", initPlayerTx);
  });

  it("Allows player to purchase ciphers", async () => {
    const ciphersToPurchase = 5;
    const expectedCost = ciphersToPurchase * CIPHER_COST;
    const solCost = expectedCost / LAMPORTS_PER_SOL;

    // Get balances before purchase
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);

    // Purchase ciphers
    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const logs = await getMsgLogs(provider, tx);
    console.log("Purchase ciphers logs -> ", logs);

    // Get balance after purchase
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);

    // Fetch player state to verify
    const playerState = await program.account.playerState.fetch(playerStatePda);

    // Fetch game state to verify
    const gameState = await program.account.gameState.fetch(gameStatePda);

    // Log balance changes for debugging
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);

    // Verify balance was reduced by the cost
    expect(playerBalanceBefore - playerBalanceAfter).to.equal(expectedCost);

    // Verify prize pool contains the expected amount
    expect(gameState.prizePool.toNumber()).to.equal(expectedCost);

    // Verify player has the correct number of ciphers
    expect(playerState.ciphers.toNumber()).to.equal(ciphersToPurchase);

    // Verify player has the correct path length
    expect(playerState.path.length).to.equal(INITIAL_PATH_LENGTH);
  });

  it("Allows player to purchase ciphers again", async () => {
    // Store current state for verification
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);

    const additionalCiphers = 3;
    const expectedCost = additionalCiphers * CIPHER_COST;

    // Purchase more ciphers as the first player
    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(additionalCiphers))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const logs = await getMsgLogs(provider, tx);
    console.log("Additional purchase ciphers logs -> ", logs);

    // Get updated states
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);

    // Log balance changes for debugging
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);

    // Verify ciphers were added to existing amount
    expect(playerStateAfter.ciphers.toNumber()).to.equal(
      playerStateBefore.ciphers.toNumber() + additionalCiphers
    );

    // Verify prize pool was increased by the correct amount
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.toNumber() + expectedCost
    );

    // Verify player balance reduced by at least the cost of the ciphers
    expect(playerBalanceBefore - playerBalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by exactly the cost of the ciphers
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedCost);
  });

  it("Allows second player to purchase ciphers", async () => {
    // Create a second player
    const player2Keypair = Keypair.generate();

    // Get the player2 state PDA
    const [player2StatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_STATE_SEED), player2Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop some SOL to the second player
    await airdropSol(provider, player2Keypair);

    // Initialize the second player
    const initPlayer2Tx = await program.methods
      .initializePlayer()
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();

    console.log("Player 2 initialization transaction signature", initPlayer2Tx);

    // Store game state before second player's transaction
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);
    const player2BalanceBefore = await provider.connection.getBalance(player2Keypair.publicKey);

    // Second player purchases ciphers
    const ciphersToPurchase = 2;
    const expectedCost = ciphersToPurchase * CIPHER_COST;

    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();
    const logs = await getMsgLogs(provider, tx);
    console.log("Second player purchase ciphers logs -> ", logs);

    // Get updated states
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);
    const player2BalanceAfter = await provider.connection.getBalance(player2Keypair.publicKey);

    // Log balance changes for debugging
    console.log("Player2 balance change:", player2BalanceBefore - player2BalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);

    // Verify player2 has the correct number of ciphers
    const player2State = await program.account.playerState.fetch(player2StatePda);
    expect(player2State.ciphers.toNumber()).to.equal(ciphersToPurchase);

    // Verify prize pool was increased by the correct amount
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.toNumber() + expectedCost
    );

    // Verify player balance reduced by at least the cost of the ciphers
    expect(player2BalanceBefore - player2BalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by exactly the cost of the ciphers
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedCost);

    // Verify player has the correct path length
    expect(player2State.path.length).to.equal(INITIAL_PATH_LENGTH);
  });

  it("Fails if player doesn't have enough balance", async () => {
    try {
      const ciphersToPurchase = 1000;
      const expectedCost = ciphersToPurchase * CIPHER_COST;

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      const logs = await getMsgLogs(provider, tx);
      console.log("Purchase ciphers logs -> ", logs);
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InsufficientBalance");
    }
  });

  it("Fails if player tries to purchase ciphers with a negative amount", async () => {
    try {
      const ciphersToPurchase = -1;

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NegativeCiphersAmount");
    }
  });

  it("Fails if player without player state account tries to purchase ciphers", async () => {
    try {
      const ciphersToPurchase = 1;

      const player2Keypair = Keypair.generate();

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: player2Keypair.publicKey,
        })
        .signers([player2Keypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("AccountNotInitialized");
    }
  });

  it("Verifies unique paths for different players", async () => {
    // Create a first player
    const player1Keypair = Keypair.generate();
    // Create a second player
    const player2Keypair = Keypair.generate();

    // Get the player1 state PDA
    const [player1StatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_STATE_SEED), player1Keypair.publicKey.toBuffer()],
      program.programId
    );
    // Get the player2 state PDA
    const [player2StatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_STATE_SEED), player2Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop some SOL to the first player
    await airdropSol(provider, player1Keypair);
    // Airdrop some SOL to the second player
    await airdropSol(provider, player2Keypair);

    // Initialize the first player
    await program.methods
      .initializePlayer()
      .accounts({
        player: player1Keypair.publicKey,
      })
      .signers([player1Keypair])
      .rpc();
    // Initialize the second player
    await program.methods
      .initializePlayer()
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();

    // First player purchases ciphers
    const ciphersToPurchase = 2;
    const expectedCost = ciphersToPurchase * CIPHER_COST;

    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player1Keypair.publicKey,
      })
      .signers([player1Keypair])
      .rpc();
    // Second player purchases ciphers
    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();

    const player1State = await program.account.playerState.fetch(player1StatePda);
    const player2State = await program.account.playerState.fetch(player2StatePda);

    expect(player1State.path).to.not.deep.equal(player2State.path);

    console.log("Player 1 path: ", player1State.path);
    console.log("Player 2 path: ", player2State.path);
  });
});
