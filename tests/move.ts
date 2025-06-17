import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
import {
  airdropSol,
  getEventLogs,
  getMsgLogs,
  getTxDetails,
  giveCard,
  sleep,
} from "./helpers/utils";
import { CARD_USAGE_EMPTY_MOCK } from "./mocks/card-usage";

describe("Move Commit-Reveal", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Keypairs
  const adminKeypair = Keypair.generate();
  const playerKeypair = Keypair.generate();
  const randomnessKeypair = Keypair.generate();

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

    // Join the game
    await program.methods
      .joinGame()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log("Player joined the game");

    // Purchase ciphers
    const ciphersToPurchase = 10;
    await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log("Player was given ciphers");
  });

  after(() => {
    provider.connection.removeOnLogsListener(playerLogsSubscription);
  });

  it("Allows successful player movement with correct choice and no cards", async () => {
    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(1))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const socialFeedEventListener = program.addEventListener("socialFeedEvent", (event) => {
      console.log("Make move events:", event.message);
    });

    // Fetch player state to get the current position
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const initialPosition = playerStateBefore.position;
    console.log(`Player position before move: ${initialPosition}`);

    // Step 1: Commit the move
    const direction = { right: {} };
    const txCommit = await program.methods
      .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const commitTxDetails = await getTxDetails(provider, txCommit);
    const commitLogs = await getMsgLogs(commitTxDetails);
    console.log("Move commit logs -> ", commitLogs);
    const commitEvents = await getEventLogs(commitTxDetails);
    console.log("Move commit events -> ", commitEvents);

    // Step 2: Reveal the move
    const txReveal = await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const revealTxDetails = await getTxDetails(provider, txReveal);
    const revealLogs = await getMsgLogs(revealTxDetails);
    console.log("Move reveal logs -> ", revealLogs);
    const revealEvents = await getEventLogs(revealTxDetails);
    console.log("Move reveal events -> ", revealEvents);

    // Fetch player state after the move
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    console.log(`Player position after move: ${playerStateAfter.position}`);

    // If the position increased, it was a correct move
    if (playerStateAfter.position > initialPosition) {
      console.log("Correct move! Position increased.");

      // Verify position was incremented
      expect(playerStateAfter.position).to.equal(initialPosition + 1);

      // Verify player cards were increased
      expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length + 1);

      // Verify gamesWon was not incremented (because the path wasn't completed)
      expect(playerStateAfter.gamesWon.toNumber()).to.equal(playerStateBefore.gamesWon.toNumber());
    } else {
      console.log("Incorrect move! Position reset to 0.");

      // Verify position was reset to 0
      expect(playerStateAfter.position).to.equal(0);

      // Verify player cards did not increase
      expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length);
    }

    // Remove listener
    await program.removeEventListener(socialFeedEventListener);
  });

  it("Makes multiple moves", async () => {
    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(3))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Make three more moves to test the game logic
    for (let i = 0; i < 3; i++) {
      // Fetch player state to get the current position
      const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
      const currentPosition = playerStateBefore.position;
      console.log(`Move ${i + 1}: Player position before move: ${currentPosition}`);

      // Make a move (direction doesn't matter, the program will generate the correct direction)
      const direction = { left: {} }; // Just pick a direction
      console.log(`Move ${i + 1}: Direction chosen: ${JSON.stringify(direction)}`);

      // Step 1: Commit the move
      await program.methods
        .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: randomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // Step 2: Reveal the move
      await program.methods
        .moveReveal()
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: randomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // Fetch player state after the move
      const playerStateAfter = await program.account.playerState.fetch(playerStatePda);

      // If the position changed, it was correct
      if (playerStateAfter.position > currentPosition) {
        console.log(`Move ${i + 1}: Correct! Advanced to position ${playerStateAfter.position}`);
      } else {
        console.log(`Move ${i + 1}: Incorrect. Reset to position ${playerStateAfter.position}`);
        // Break the loop if we got reset
        break;
      }

      // TODO: What makes sense to test here?
    }
  });

  it("Tests lastLogin update", async () => {
    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(1))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Fetch player state to get the current position
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const lastLoginBefore = playerStateBefore.lastLogin.toString();
    console.log(`Player lastLogin before move: ${lastLoginBefore}`);

    // Wait a moment to ensure timestamp will be different
    await sleep(1000);

    // Move
    const direction = { right: {} };
    await program.methods
      .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Check lastLogin after commit
    const playerStateAfterCommit = await program.account.playerState.fetch(playerStatePda);
    const lastLoginAfterCommit = playerStateAfterCommit.lastLogin.toString();
    console.log(`Player lastLogin after move: ${lastLoginAfterCommit}`);

    // Verify lastLogin was updated
    expect(Number(lastLoginAfterCommit)).to.be.greaterThan(Number(lastLoginBefore));

    // Wait a moment to ensure timestamp will be different
    await sleep(1000);

    // Complete the move by revealing
    await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Check lastLogin after reveal
    const playerStateAfterReveal = await program.account.playerState.fetch(playerStatePda);
    const lastLoginAfterReveal = playerStateAfterReveal.lastLogin.toString();
    console.log(`Player lastLogin after move: ${lastLoginAfterReveal}`);

    // Verify lastLogin was updated
    expect(Number(lastLoginAfterReveal)).to.be.greaterThan(Number(lastLoginAfterCommit));
  });

  it("Tests incorrect move behavior", async () => {
    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(1))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Fetch player state to get the current position
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const currentPosition = playerStateBefore.position;
    console.log(`Player position before move: ${currentPosition}`);

    // Make a move (direction doesn't matter, the program will generate the correct direction)
    const direction = { right: {} }; // Just pick a direction
    console.log(`Direction chosen: ${JSON.stringify(direction)}`);

    // Step 1: Commit the move
    await program.methods
      .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Step 2: Reveal the move
    const txReveal = await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const revealTxDetails = await getTxDetails(provider, txReveal);
    const revealLogs = await getMsgLogs(revealTxDetails);
    console.log("Move reveal logs -> ", revealLogs);
    const revealEvents = await getEventLogs(revealTxDetails);
    console.log("Move reveal events -> ", revealEvents);

    // Fetch player state after the move
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    console.log(`Player position after move: ${playerStateAfter.position}`);

    // If the position didn't increase, it was an incorrect move
    if (playerStateAfter.position <= currentPosition) {
      console.log("Incorrect move! Position reset to 0.");

      // Verify position was reset to 0
      expect(playerStateAfter.position).to.equal(0);

      // Verify player cards did not increase
      expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length);
    } else {
      console.log("Correct move! Position increased.");

      // Verify position was incremented
      expect(playerStateAfter.position).to.equal(currentPosition + 1);

      // Verify player cards were increased
      expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length + 1);
    }
  });

  it("Applies card effects correctly on valid move", async () => {
    await giveCard(program, playerKeypair, playerStatePda, { doubler: {} });
    await giveCard(program, playerKeypair, playerStatePda, { swift: {} });

    // Fetch player state before move
    let stateBefore = await program.account.playerState.fetch(playerStatePda);

    const correctDirection = { right: {} }; // based on the TEST MODE for randomness
    const cards = { shield: false, doubler: true, swift: true };

    // Step 1: Commit the move
    await program.methods
      .moveCommit(correctDirection, cards)
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    // Step 2: Reveal the move
    const txReveal = await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const revealTxDetails = await getTxDetails(provider, txReveal);
    const revealLogs = await getMsgLogs(revealTxDetails);
    console.log("Move reveal logs -> ", revealLogs);
    const revealEvents = await getEventLogs(revealTxDetails);
    console.log("Move reveal events -> ", revealEvents);

    const afterMove = await program.account.playerState.fetch(playerStatePda);

    expect(afterMove.ciphers.toNumber()).to.equal(stateBefore.ciphers.toNumber() - 1); // Used 1 cipher for move, 2 for cards, but got 2 back for using swift
    expect(afterMove.position).to.equal(stateBefore.position + 1);

    expect(afterMove.cards.length).to.be.equal(stateBefore.cards.length); // 2 cards used, 2 cards received due to doubler
  });

  it("Validates randomness account correctly", async () => {
    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(1))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const invalidRandomnessKeypair = Keypair.generate();

    // Try to make a move with an invalid randomness account
    try {
      // Step 1: Commit the move
      await program.methods
        .moveCommit({ left: {} }, CARD_USAGE_EMPTY_MOCK)
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: randomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // Step 2: Reveal the move - but supply wrong randomness account
      await program.methods
        .moveReveal()
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: invalidRandomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("Unauthorized");
      return;
    }

    // If we get here, no error was thrown
    expect.fail("Expected an error but none was thrown");
  });

  it("Verifies game completion and prize distribution", async () => {
    // Get initial balances
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerBalanceBefore = await provider.connection.getBalance(playerKeypair.publicKey);
    console.log(`Initial prize pool: ${gameStateBefore.prizePool} lamports`);
    console.log(`Initial player balance: ${playerBalanceBefore} lamports`);

    // Setup event listener for win announcements
    let winEventCaptured = false;
    const socialFeedEventListener = program.addEventListener("socialFeedEvent", (event) => {
      if (event.eventType.gameWon) {
        winEventCaptured = true;
        console.log("Win event captured:", event.message);
      }
    });

    // Move player to winning position (path_length - 1)
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const movesNeeded = gameStateBefore.pathLength - playerStateBefore.position;

    // Purchase ciphers for the test
    await program.methods
      .purchaseCiphers(new anchor.BN(movesNeeded))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log(`Moving player ${movesNeeded} times to reach the end...`);
    for (let i = 0; i < movesNeeded; i++) {
      const direction = { right: {} }; // This is always the correct direction for tests

      // Step 1: Commit the move
      await program.methods
        .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: randomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // Step 2: Reveal the move
      await program.methods
        .moveReveal()
        .accounts({
          player: playerKeypair.publicKey,
          randomnessAccount: randomnessKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();

      // Wait a small amount of time between moves
      await sleep(100);
    }

    // Get final state
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    const playerBalanceAfter = await provider.connection.getBalance(playerKeypair.publicKey);
    console.log(`Final prize pool: ${gameStateAfter.prizePool} lamports`);
    console.log(`Final player balance: ${playerBalanceAfter} lamports`);

    // Verify prize pool was distributed
    expect(gameStateAfter.prizePool.toNumber()).to.equal(0);
    expect(playerBalanceAfter).to.be.above(playerBalanceBefore);

    // Verify the game start time was updated to trigger resets
    const gameStartBefore = gameStateBefore.start.toNumber();
    const gameStartAfter = gameStateAfter.start.toNumber();
    expect(gameStartAfter).to.be.above(gameStartBefore);

    // Verify win event was emitted
    expect(winEventCaptured).to.be.true;

    // Cleanup
    await program.removeEventListener(socialFeedEventListener);
  });
});
