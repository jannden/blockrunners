import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED, CIPHER_COST } from "./helpers/constants";
import { airdropSol, getMsgLogs, sleep } from "./helpers/utils";

describe("Purchase ciphers", () => {
  // Configure the client to use the local cluster.
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

  let playerLogsSubscription: number;

  before(async () => {
    // Logs subscription
    playerLogsSubscription = provider.connection.onLogs(playerKeypair.publicKey, (logs) => {
      // ENABLE THIS TO SEE THE PLAYER LOGS
      // console.log("Player logs changed:", logs);
    });

    // Airdrop SOL to the admin and player
    await airdropSol(provider, adminKeypair);
    await airdropSol(provider, playerKeypair);

    // Initialize the game if not already initialized
    const gameState = await program.account.gameState.fetchNullable(gameStatePda);
    if (!gameState) {
      await program.methods
        .initializeGame()
        .accounts({
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("Game initialized");
    }

    // Initialize player state
    await program.methods
      .initializePlayer()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log("Player initialized");
  });

  after(() => {
    provider.connection.removeOnLogsListener(playerLogsSubscription);
  });

  it("Allows player to purchase ciphers", async () => {
    const socialFeedEventListener = program.addEventListener("socialFeedEvent", (event) => {
      console.log("Purchase ciphers events:", event.message);
    });

    const ciphersToPurchase = 5;
    const expectedCost = ciphersToPurchase * CIPHER_COST;

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

    // Verify totalCiphersBought was increased by the correct amount
    expect(playerStateAfter.totalCiphersBought.toNumber()).to.equal(
      playerStateBefore.totalCiphersBought.toNumber() + ciphersToPurchase
    );

    // Verify player has joined the game
    expect(playerStateBefore.inGame).to.equal(false);
    expect(playerStateAfter.inGame).to.equal(true);

    // Verify the amount of cards did not increase
    expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length);

    // Verify player events were increased
    expect(playerStateAfter.playerEvents.length).to.be.greaterThan(
      playerStateBefore.playerEvents.length
    );

    // Verify game events were increased
    expect(gameStateAfter.gameEvents.length).to.be.greaterThan(gameStateBefore.gameEvents.length);

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

    // Verify totalCiphersBought was increased by the correct amount
    expect(playerStateAfter.totalCiphersBought.toNumber()).to.equal(
      playerStateBefore.totalCiphersBought.toNumber() + additionalCiphers
    );

    // Verify prize pool was increased by the correct amount
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.toNumber() + expectedCost
    );

    // Verify player balance reduced by at least the cost of the ciphers
    expect(playerBalanceBefore - playerBalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by exactly the cost of the ciphers
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedCost);

    // Verify player inGame status does not change
    expect(playerStateAfter.inGame).to.equal(true);

    // Verify the amount of cards did not increase
    expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length);

    // Verify the amount of player events increased
    expect(playerStateAfter.playerEvents.length).to.equal(
      playerStateBefore.playerEvents.length + 1
    );

    // Verify the amount of game events didn't increase
    expect(gameStateAfter.gameEvents.length).to.equal(gameStateBefore.gameEvents.length);
  });

  it("Allows second player to purchase ciphers", async () => {
    // Create a second player
    const player2Keypair = Keypair.generate();
    const randomness2Keypair = Keypair.generate();

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

    // Get state before second player's transaction
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const player2StateBefore = await program.account.playerState.fetch(player2StatePda);

    // Get balances before purchase
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

    // Verify player has joined the game
    expect(player2StateBefore.inGame).to.equal(false);
    expect(player2StateAfter.inGame).to.equal(true);

    // Verify the amount of cards did not increase
    expect(player2StateAfter.cards.length).to.equal(player2StateBefore.cards.length);
  });

  it("Tests lastLogin update when purchasing ciphers", async () => {
    // Fetch player state to get the current lastLogin value
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const lastLoginBefore = playerStateBefore.lastLogin.toString();
    console.log(`Player lastLogin before purchase: ${lastLoginBefore}`);

    // Wait a moment to ensure timestamp will be different
    await sleep(1000);

    // Purchase ciphers
    const ciphersToPurchase = 1;
    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Check lastLogin after purchase
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    const lastLoginAfter = playerStateAfter.lastLogin.toString();
    console.log(`Player lastLogin after purchase: ${lastLoginAfter}`);

    // Verify lastLogin was updated
    expect(Number(lastLoginAfter)).to.be.greaterThan(Number(lastLoginBefore));
  });

  it("Fails if player doesn't have enough balance", async () => {
    try {
      const ciphersToPurchase = LAMPORTS_PER_SOL / CIPHER_COST + 1;

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // If we get here, no error was thrown
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InsufficientBalance");
    }
  });

  it("Fails if player tries to purchase ciphers with a zero amount", async () => {
    try {
      const ciphersToPurchase = 0;

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // If we get here, no error was thrown
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NegativeCiphersAmount");
    }
  });

  it("Fails if player without player state account tries to purchase ciphers", async () => {
    try {
      const ciphersToPurchase = 1;

      const player2Keypair = Keypair.generate();
      const randomness2Keypair = Keypair.generate();

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: player2Keypair.publicKey,
        })
        .signers([player2Keypair])
        .rpc();

      // If we get here, no error was thrown
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("AccountNotInitialized");
    }
  });
});
