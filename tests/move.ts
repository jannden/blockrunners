import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
import { airdropSol, getMsgLogs, giveCard, sleep } from "./helpers/utils";
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
      console.log("Player logs changed:", logs);
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
    const socialFeedEventListener = program.addEventListener("socialFeedEvent", (event) => {
      console.log("Make move events:", event.message);
    });

    // Fetch player state to get the current position
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const initialPosition = playerStateBefore.position;
    console.log(`Player position before move: ${initialPosition}`);

    // Make a move (direction doesn't matter, the program will generate the correct direction)
    const direction = { left: {} }; // Just pick a direction
    console.log(`Direction chosen: ${JSON.stringify(direction)}`);

    // Step 1: Commit the move
    const txCommit = await program.methods
      .moveCommit(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const commitLogs = await getMsgLogs(provider, txCommit);
    console.log("Move commit logs -> ", commitLogs);

    // Step 2: Reveal the move
    const txReveal = await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const revealLogs = await getMsgLogs(provider, txReveal);
    console.log("Move reveal logs -> ", revealLogs);

    // Fetch player state after the move
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    console.log(`Player position after move: ${playerStateAfter.position}`);

    // Verify lastLogin was updated
    expect(playerStateAfter.lastLogin.toString()).to.not.equal(
      playerStateBefore.lastLogin.toString()
    );

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
    // Make three more moves to test the game logic
    for (let i = 0; i < 3; i++) {
      // Fetch player state to get the current position
      const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
      const currentPosition = playerStateBefore.position;
      const lastLoginBefore = playerStateBefore.lastLogin.toString();
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

      // Verify lastLogin was updated
      expect(playerStateAfter.lastLogin.toString()).to.not.equal(lastLoginBefore);

      // If the position changed, it was correct
      if (playerStateAfter.position > currentPosition) {
        console.log(`Move ${i + 1}: Correct! Advanced to position ${playerStateAfter.position}`);
      } else {
        console.log(`Move ${i + 1}: Incorrect. Reset to position ${playerStateAfter.position}`);
        // Break the loop if we got reset
        break;
      }
    }
  });

  it("Tests incorrect move behavior", async () => {
    // Fetch player state to get the current position
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
    const currentPosition = playerStateBefore.position;
    const lastLoginBefore = playerStateBefore.lastLogin.toString();
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

    // Sleep for 1 seconds to ensure timestamp changes
    await sleep(1000);

    // Step 2: Reveal the move
    const txReveal = await program.methods
      .moveReveal()
      .accounts({
        player: playerKeypair.publicKey,
        randomnessAccount: randomnessKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    const logs = await getMsgLogs(provider, txReveal);
    console.log("Move reveal logs -> ", logs);

    // Fetch player state after the move
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    console.log(`Player position after move: ${playerStateAfter.position}`);

    // Verify lastLogin was updated
    expect(playerStateAfter.lastLogin.toString()).to.not.equal(lastLoginBefore);

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
    console.log("State before move -> ", stateBefore);

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

    const logs = await getMsgLogs(provider, txReveal);
    console.log("Move reveal logs -> ", logs);

    const afterMove = await program.account.playerState.fetch(playerStatePda);
    console.log("State after move -> ", afterMove);

    expect(afterMove.ciphers.toNumber()).to.be.equal(9);
    expect(afterMove.position).to.be.greaterThan(stateBefore.position); // moved forward

    // TODO: Temporary disabling to refactor cards from vector to hashmap
    // expect(afterMove.cards.length).to.be.equal(stateBefore.cards.length); // doubler effect

    // Verify lastLogin was updated
    expect(afterMove.lastLogin.toString()).to.not.equal(stateBefore.lastLogin.toString());
  });

  it("Applies card effects correctly on invalid move", async () => {
    await giveCard(program, playerKeypair, playerStatePda, { shield: {} });
    let stateBefore = await program.account.playerState.fetch(playerStatePda);
    console.log("State before move DEBUG -> ", stateBefore);

    const incorrectDirection = { left: {} }; // based on the TEST MODE for randomness
    const cards = { shield: true, doubler: false, swift: false };

    // Step 1: Commit the move
    await program.methods
      .moveCommit(incorrectDirection, cards) // Incorrect direction, Shield
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

    const logs = await getMsgLogs(provider, txReveal);
    console.log("Move reveal logs -> ", logs);

    const stateAfterBad = await program.account.playerState.fetch(playerStatePda);
    console.log("State after move DEBUG -> ", stateAfterBad);

    expect(stateAfterBad.position).to.equal(stateBefore.position); // no reset

    // Verify lastLogin was updated
    expect(stateAfterBad.lastLogin.toString()).to.not.equal(stateBefore.lastLogin.toString());
  });

  it("Verifies game completion and prize distribution", async () => {
    await program.methods
      .purchaseCiphers(new anchor.BN(10))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

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
      await sleep(500);
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
