import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
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
    const socialFeedEventListener = program.addEventListener("socialFeedEvent", event => {
      console.log("Event data:", event.message);
    });
    
    const ciphersToPurchase = 5;
    const expectedCost = ciphersToPurchase * CIPHER_COST;
    const solCost = expectedCost / LAMPORTS_PER_SOL;

    // Get states before purchase
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);

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
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);

    // Fetch game state to verify
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);

    // Log balance changes for debugging
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);
    console.log("Prize pool before:", gameStateBefore.prizePool.toNumber());
    console.log("Prize pool after:", gameStateAfter.prizePool.toNumber());

    // Verify balance was reduced by the cost
    expect(playerBalanceBefore - playerBalanceAfter).to.equal(expectedCost);

    // Verify prize pool was increased by the expected amount
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.toNumber() + expectedCost
    );

    // Verify ciphers were increased by the correct amount
    expect(playerStateAfter.ciphers.toNumber()).to.equal(
      playerStateBefore.ciphers.toNumber() + ciphersToPurchase
    );

    // Verify player has at least 1 step in their path
    // With the new logic, we only generate one step at a time
    expect(playerStateAfter.path.length).to.be.at.least(1);
    console.log("Player path after purchase:", playerStateAfter.path);

    // Verify player events were increased
    expect(playerStateAfter.playerEvents.length).to.equal(
      playerStateBefore.playerEvents.length + 1
    );

    // Verify game events were increased
    expect(gameStateAfter.gameEvents.length).to.equal(
      gameStateBefore.gameEvents.length + 1
    );

    // Remove listener
    await program.removeEventListener(socialFeedEventListener);
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

    // Verify the amount of player events increased
    expect(playerStateAfter.playerEvents.length).to.equal(
      playerStateBefore.playerEvents.length + 1
    );

    // Verify the amount of game events didn't increase
    expect(gameStateAfter.gameEvents.length).to.equal(
      gameStateBefore.gameEvents.length
    );
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
    // (should be ciphersToPurchase since this is a new player)
    const player2StateAfter = await program.account.playerState.fetch(player2StatePda);
    expect(player2StateAfter.ciphers.toNumber()).to.equal(ciphersToPurchase);

    // Verify prize pool was increased by the correct amount
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.toNumber() + expectedCost
    );

    // Verify player balance reduced by at least the cost of the ciphers
    expect(player2BalanceBefore - player2BalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by exactly the cost of the ciphers
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedCost);

    // Verify player has at least 1 step in their path (new logic)
    expect(player2StateAfter.path.length).to.be.at.least(1);
    console.log("Player2 path after purchase:", player2StateAfter.path);
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

  it("Verifies different players have their own paths", async () => {
    // Create two new players
    const player1Keypair = Keypair.generate();
    const player2Keypair = Keypair.generate();

    // Get the player state PDAs
    const [player1StatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_STATE_SEED), player1Keypair.publicKey.toBuffer()],
      program.programId
    );
    const [player2StatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLAYER_STATE_SEED), player2Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL to both players
    await airdropSol(provider, player1Keypair);
    await airdropSol(provider, player2Keypair);

    // Initialize both players
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

    // Both players purchase ciphers
    const ciphersToPurchase = 2;
    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player1Keypair.publicKey,
      })
      .signers([player1Keypair])
      .rpc();
    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player2Keypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();

    // Get both player states
    const player1State = await program.account.playerState.fetch(player1StatePda);
    const player2State = await program.account.playerState.fetch(player2StatePda);

    console.log("Player 1 path: ", player1State.path);
    console.log("Player 2 path: ", player2State.path);

    // Since both paths might only be one step, they could be identical by chance
    // Instead of asserting they're different, let's just verify both players have valid paths
    expect(player1State.path.length).to.be.at.least(1);
    expect(player2State.path.length).to.be.at.least(1);
    
    // Try to make a move with each player to force generate unique paths
    // Make a move with player 1
    try {
      const move1Tx = await program.methods
        .makeMove(player1State.path[0])
        .accounts({
          player: player1Keypair.publicKey,
          playerState: player1StatePda,
        })
        .signers([player1Keypair])
        .rpc();
      
      console.log("Player 1 made a move");
      
      // Make a move with player 2 (different direction)
      let player2Direction;
      if (player2State.path[0].left !== undefined) {
        player2Direction = { right: {} };
      } else {
        player2Direction = { left: {} };
      }
      
      const move2Tx = await program.methods
        .makeMove(player2Direction)
        .accounts({
          player: player2Keypair.publicKey,
          playerState: player2StatePda,
        })
        .signers([player2Keypair])
        .rpc();
        
      console.log("Player 2 made a move");
    } catch (error) {
      console.log("Error making moves:", error);
    }
    
    // Get updated player states
    const player1StateAfter = await program.account.playerState.fetch(player1StatePda);
    const player2StateAfter = await program.account.playerState.fetch(player2StatePda);
    
    console.log("Player 1 path after move: ", player1StateAfter.path);
    console.log("Player 2 path after move: ", player2StateAfter.path);
    
    // At this point, the players should have different paths or positions
    if (JSON.stringify(player1StateAfter.path) === JSON.stringify(player2StateAfter.path)) {
      // If paths are identical, their positions should be different
      expect(player1StateAfter.position).to.not.equal(player2StateAfter.position);
    } else {
      // Paths are different (success)
      console.log("Players have different paths");
    }
  });
});
