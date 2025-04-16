import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
import { airdropSol, getMsgLogs, giveCard, sleep } from "./helpers/utils";
import { CARD_USAGE_EMPTY_MOCK } from "./mocks/card-usage";

describe("Make Move", () => {
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

    // Purchase ciphers to generate path
    const ciphersToPurchase = 10;
    const tx = await program.methods
      .purchaseCiphers(new anchor.BN(ciphersToPurchase))
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();

    console.log("Player joined the game");
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

    // Sleep for 2 seconds to ensure timestamp changes
    await sleep(2000);

    // Make the move
    const tx = await program.methods
      .makeMove(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        playerState: playerStatePda,
      })
      .signers([playerKeypair])
      .rpc();

    const logs = await getMsgLogs(provider, tx);
    console.log("Make move logs -> ", logs);

    // Fetch player state after the move
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
    console.log(`Player position after move: ${playerStateAfter.position}`);

    // Verify lastLogin was updated
    expect(playerStateAfter.lastLogin.toString()).to.not.equal(playerStateBefore.lastLogin.toString());

    // If the position increased, it was a correct move
    if (playerStateAfter.position > initialPosition) {
      console.log("Correct move! Position increased.");

      // Verify position was incremented
      expect(playerStateAfter.position).to.equal(initialPosition + 1);

      // Verify player cards were increased
      expect(playerStateAfter.cards.length).to.equal(playerStateBefore.cards.length + 1);
      
      // Verify gamesPlayed was not incremented (because the path wasn't completed)
      expect(playerStateAfter.gamesPlayed.toNumber()).to.equal(
        playerStateBefore.gamesPlayed.toNumber()
      );
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

      // Sleep for 2 seconds to ensure timestamp changes
      await sleep(2000);

      // Make the move
      const tx = await program.methods
        .makeMove(direction, CARD_USAGE_EMPTY_MOCK)
        .accounts({
          player: playerKeypair.publicKey,
          playerState: playerStatePda,
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

    // Sleep for 2 seconds to ensure timestamp changes
    await sleep(2000);

    // Make the move
    const tx = await program.methods
      .makeMove(direction, CARD_USAGE_EMPTY_MOCK)
      .accounts({
        player: playerKeypair.publicKey,
        playerState: playerStatePda,
      })
      .signers([playerKeypair])
      .rpc();

    const logs = await getMsgLogs(provider, tx);
    console.log("Make move logs -> ", logs);

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
    // Give all three types of cards
    await giveCard(program, playerKeypair, playerStatePda, { doubler: {} });
    await giveCard(program, playerKeypair, playerStatePda, { swift: {} });

    // Fetch player state before move
    let stateBefore = await program.account.playerState.fetch(playerStatePda);

    // Sleep for 2 seconds to ensure timestamp changes
    await sleep(2000);

    const correctDirection = { right: {} }; // irrelevant, we assume random matches
    const cards = { shield: false, doubler: true, swift: true }; // Doubler and Swift
    await program.methods
      .makeMove(correctDirection, cards)
      .accounts({
        player: playerKeypair.publicKey,
        playerState: playerStatePda,
        gameState: gameStatePda,
      })
      .signers([playerKeypair])
      .rpc();

    const afterMove = await program.account.playerState.fetch(playerStatePda);
    expect(afterMove.ciphers.toNumber()).to.be.equal(9);
    expect(afterMove.position).to.be.greaterThan(stateBefore.position); // moved forward
    expect(afterMove.cards.length).to.be.equal(4); // doubler effect
  });

  it("Applies card effects correctly on invalid move", async () => {
    let stateBefore = await program.account.playerState.fetch(playerStatePda);
    await giveCard(program, playerKeypair, playerStatePda, { shield: {} }); // Add shield again

    // Sleep for 2 seconds to ensure timestamp changes
    await sleep(2000);

    await program.methods
      .makeMove({ left: {} }, { shield: true, doubler: false, swift: false }) // Incorrect direction, Shield
      .accounts({
        player: playerKeypair.publicKey,
        playerState: playerStatePda,
        gameState: gameStatePda,
      })
      .signers([playerKeypair])
      .rpc();

    const stateAfterBad = await program.account.playerState.fetch(playerStatePda);
    expect(stateAfterBad.position).to.equal(stateBefore.position); // no reset
  });
});
