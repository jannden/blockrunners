import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import {
  ADMIN_KEYPAIR,
  GAME_STATE_SEED,
  PLAYER_STATE_SEED,
  CIPHER_COST,
  PRIZE_POOL_PERCENTAGE,
} from "./helpers/constants";
import {
  airdropSol,
  getEventLogs,
  getMsgLogs,
  getTotalCards,
  getTxDetails,
  sleep,
} from "./helpers/utils";

describe("Purchase ciphers", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Generate test accounts
  const adminKeypair = ADMIN_KEYPAIR;
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
    const ciphersToPurchase = 5;
    const expectedCost = ciphersToPurchase * CIPHER_COST;
    const expectedPrizePoolIncrease = new anchor.BN(expectedCost)
      .mul(new anchor.BN(PRIZE_POOL_PERCENTAGE))
      .div(new anchor.BN(100));
    const expectedAdminShare = new anchor.BN(expectedCost).sub(expectedPrizePoolIncrease);

    // Get states before purchase
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);

    // Get balances before purchase
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);
    const adminBalanceBefore = await provider.connection.getBalance(adminKeypair.publicKey);

    console.log("=== PURCHASE CIPHERS TEST ===");
    console.log(`Purchasing ${ciphersToPurchase} ciphers at ${CIPHER_COST} lamports each`);
    console.log(`Expected total cost: ${expectedCost} lamports`);
    console.log(
      `Expected prize pool increase: ${expectedPrizePoolIncrease} lamports (${PRIZE_POOL_PERCENTAGE}%)`
    );
    console.log(
      `Expected admin share: ${expectedAdminShare} lamports (${100 - PRIZE_POOL_PERCENTAGE}%)`
    );
    console.log(`Admin balance before: ${adminBalanceBefore} lamports`);

    // Purchase ciphers
    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: playerKeypair.publicKey,
        adminWallet: adminKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const txDetails = await getTxDetails(provider, tx);
    const logs = await getMsgLogs(txDetails);
    console.log("Purchase ciphers logs -> ", logs);
    const events = await getEventLogs(txDetails);
    console.log("Purchase ciphers events -> ", events);

    // Get balance after purchase
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);
    const adminBalanceAfter = await provider.connection.getBalance(adminKeypair.publicKey);

    // Fetch player state to verify
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);

    // Fetch game state to verify
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);

    // Log balance changes for debugging
    console.log("=== BALANCE CHANGES ===");
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);
    console.log("Admin balance change:", adminBalanceAfter - adminBalanceBefore);
    console.log("Prize pool before:", gameStateBefore.prizePool.toNumber());
    console.log("Prize pool after:", gameStateAfter.prizePool.toNumber());
    console.log("Expected prize pool increase:", expectedPrizePoolIncrease);
    console.log("Expected admin share:", expectedAdminShare);

    // Verify balance was reduced by the cost
    expect(playerBalanceBefore - playerBalanceAfter).to.equal(expectedCost);

    // Verify prize pool was increased by PRIZE_POOL_PERCENTAGE% of the cost
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.add(expectedPrizePoolIncrease).toNumber()
    );

    // Verify admin received their share
    expect(adminBalanceAfter - adminBalanceBefore).to.equal(expectedAdminShare.toNumber());

    // Verify game balance increased by only the prize pool portion
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedPrizePoolIncrease.toNumber());

    // Verify ciphers were increased by the correct amount
    expect(playerStateAfter.ciphers.toNumber()).to.equal(
      playerStateBefore.ciphers.toNumber() + ciphersToPurchase
    );

    // Verify totalCiphersBought was increased by the correct amount
    expect(playerStateAfter.totalCiphersBought.toNumber()).to.equal(
      playerStateBefore.totalCiphersBought.toNumber() + ciphersToPurchase
    );

    // Verify player events were increased
    expect(playerStateAfter.playerEvents.length).to.be.greaterThan(
      playerStateBefore.playerEvents.length
    );
  });

  it("Allows player to purchase ciphers again", async () => {
    // Store current state for verification
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);
    const adminBalanceBefore = await provider.connection.getBalance(adminKeypair.publicKey);

    const additionalCiphers = 3;
    const expectedCost = additionalCiphers * CIPHER_COST;
    const expectedPrizePoolIncrease = new anchor.BN(expectedCost)
      .mul(new anchor.BN(PRIZE_POOL_PERCENTAGE))
      .div(new anchor.BN(100));
    const expectedAdminShare = new anchor.BN(expectedCost).sub(expectedPrizePoolIncrease);

    console.log("=== SECOND PURCHASE TEST ===");
    console.log(`Purchasing ${additionalCiphers} additional ciphers`);
    console.log(`Expected admin share: ${expectedAdminShare} lamports`);

    // Purchase more ciphers as the first player
    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(additionalCiphers))
      .accounts({
        player: playerKeypair.publicKey,
        adminWallet: adminKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const txDetails = await getTxDetails(provider, tx);
    const logs = await getMsgLogs(txDetails);
    console.log("Additional purchase ciphers logs -> ", logs);
    const events = await getEventLogs(txDetails);
    console.log("Additional purchase ciphers events -> ", events);

    // Get updated states
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);
    const adminBalanceAfter = await provider.connection.getBalance(adminKeypair.publicKey);

    // Log balance changes for debugging
    console.log("Player balance change:", playerBalanceBefore - playerBalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);
    console.log("Admin balance change:", adminBalanceAfter - adminBalanceBefore);

    // Verify ciphers were added to existing amount
    expect(playerStateAfter.ciphers.toNumber()).to.equal(
      playerStateBefore.ciphers.toNumber() + additionalCiphers
    );

    // Verify totalCiphersBought was increased by the correct amount
    expect(playerStateAfter.totalCiphersBought.toNumber()).to.equal(
      playerStateBefore.totalCiphersBought.toNumber() + additionalCiphers
    );

    // Verify prize pool was increased by PRIZE_POOL_PERCENTAGE% of the cost
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.add(expectedPrizePoolIncrease).toNumber()
    );

    // Verify admin received their share
    expect(adminBalanceAfter - adminBalanceBefore).to.equal(expectedAdminShare.toNumber());

    // Verify player balance reduced by at least the cost of the ciphers
    expect(playerBalanceBefore - playerBalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by only the prize pool portion
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedPrizePoolIncrease.toNumber());

    // Verify the amount of cards did not increase
    expect(getTotalCards(playerStateAfter.cards)).to.equal(getTotalCards(playerStateBefore.cards));

    // Verify the amount of player events increased
    expect(playerStateAfter.playerEvents.length).to.equal(
      playerStateBefore.playerEvents.length + 1
    );

    // Verify the amount of game events increased due to funding surge
    expect(gameStateAfter.gameEvents.length).to.equal(gameStateBefore.gameEvents.length + 1);
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

    // Get state before second player's transaction
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const player2StateBefore = await program.account.playerState.fetch(player2StatePda);

    // Get balances before purchase
    const gameBalanceBefore = await provider.connection.getBalance(gameStatePda);
    const player2BalanceBefore = await provider.connection.getBalance(player2Keypair.publicKey);
    const adminBalanceBefore = await provider.connection.getBalance(adminKeypair.publicKey);

    // Second player purchases ciphers
    const ciphersToPurchase = 2;
    const expectedCost = ciphersToPurchase * CIPHER_COST;
    const expectedPrizePoolIncrease = new anchor.BN(expectedCost)
      .mul(new anchor.BN(PRIZE_POOL_PERCENTAGE))
      .div(new anchor.BN(100));
    const expectedAdminShare = new anchor.BN(expectedCost).sub(expectedPrizePoolIncrease);

    console.log("=== SECOND PLAYER PURCHASE TEST ===");
    console.log(`Second player purchasing ${ciphersToPurchase} ciphers`);
    console.log(`Expected admin share: ${expectedAdminShare} lamports`);

    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: player2Keypair.publicKey,
        adminWallet: adminKeypair.publicKey,
      })
      .signers([player2Keypair])
      .rpc();
    const txDetails = await getTxDetails(provider, tx);
    const logs = await getMsgLogs(txDetails);
    console.log("Second player purchase ciphers logs -> ", logs);
    const events = await getEventLogs(txDetails);
    console.log("Second player purchase ciphers events -> ", events);

    // Get updated states
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);
    const gameBalanceAfter = await provider.connection.getBalance(gameStatePda);
    const player2BalanceAfter = await provider.connection.getBalance(player2Keypair.publicKey);
    const adminBalanceAfter = await provider.connection.getBalance(adminKeypair.publicKey);

    // Log balance changes for debugging
    console.log("Player2 balance change:", player2BalanceBefore - player2BalanceAfter);
    console.log("Game balance change:", gameBalanceAfter - gameBalanceBefore);
    console.log("Admin balance change:", adminBalanceAfter - adminBalanceBefore);

    // Verify player2 has the correct number of ciphers
    // (should be ciphersToPurchase since this is a new player)
    const player2StateAfter = await program.account.playerState.fetch(player2StatePda);
    expect(player2StateAfter.ciphers.toNumber()).to.equal(ciphersToPurchase);

    // Verify prize pool was increased by PRIZE_POOL_PERCENTAGE% of the cost
    expect(gameStateAfter.prizePool.toNumber()).to.equal(
      gameStateBefore.prizePool.add(expectedPrizePoolIncrease).toNumber()
    );

    // Verify admin received their share
    expect(adminBalanceAfter - adminBalanceBefore).to.equal(expectedAdminShare.toNumber());

    // Verify player balance reduced by at least the cost of the ciphers
    expect(player2BalanceBefore - player2BalanceAfter).to.be.greaterThan(expectedCost - 100); // Allow for small rounding

    // Verify game balance increased by only the prize pool portion
    expect(gameBalanceAfter - gameBalanceBefore).to.equal(expectedPrizePoolIncrease.toNumber());
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
        adminWallet: adminKeypair.publicKey,
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
          adminWallet: adminKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InsufficientBalance");
      return;
    }
    expect.fail("Expected an error but none was thrown");
  });

  it("Fails if player tries to purchase ciphers with a zero amount", async () => {
    try {
      const ciphersToPurchase = 0;

      const tx = await program.methods
        .purchaseCiphers(new anchor.BN(ciphersToPurchase))
        .accounts({
          player: playerKeypair.publicKey,
          adminWallet: adminKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NegativeCiphersAmount");
      return;
    }
    expect.fail("Expected an error but none was thrown");
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
          adminWallet: adminKeypair.publicKey,
        })
        .signers([player2Keypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("AccountNotInitialized");
      return;
    }
    expect.fail("Expected an error but none was thrown");
  });
});
