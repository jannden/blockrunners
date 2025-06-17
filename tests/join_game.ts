import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
import { airdropSol, getEventLogs, getMsgLogs, getTxDetails } from "./helpers/utils";

describe("Join game", () => {
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
    // Airdrop SOL to admin and player
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

    // Initialize player
    const initPlayerTx = await program.methods
      .initializePlayer()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    console.log("Player initialization transaction signature:", initPlayerTx);
  });

  it("Allows player to join game", async () => {
    const socialFeedEventListener = program.addEventListener("socialFeedEvent", (event) => {
      console.log("Join game events:", event.message);
    });

    // Get states before joining
    const gameStateBefore = await program.account.gameState.fetch(gameStatePda);
    const playerStateBefore = await program.account.playerState.fetch(playerStatePda);

    // Verify player is not already in a game
    expect(playerStateBefore.gameStart).to.be.null;

    // Join game
    const tx = await program.methods
      .joinGame()
      .accounts({
        player: playerKeypair.publicKey,
      })
      .signers([playerKeypair])
      .rpc();
    const txDetails = await getTxDetails(provider, tx);
    const logs = await getMsgLogs(txDetails);
    console.log("Join game logs -> ", logs);
    const events = await getEventLogs(txDetails);
    console.log("Join game events -> ", events);

    // Fetch player state to verify
    const playerStateAfter = await program.account.playerState.fetch(playerStatePda);

    // Fetch game state to verify
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);

    // Verify player has joined the game
    expect(playerStateAfter.gameStart).to.not.be.null;
    expect(playerStateAfter.gameStart.toString()).to.equal(gameStateBefore.start.toString());

    // Verify the player has the default cards
    expect(playerStateAfter.cards.length).to.equal(3);
    expect(playerStateAfter.cards).to.deep.equal([{ shield: {} }, { doubler: {} }, { swift: {} }]);

    // Verify game events were increased
    expect(gameStateAfter.gameEvents.length).to.be.greaterThan(gameStateBefore.gameEvents.length);

    // Remove listener
    await program.removeEventListener(socialFeedEventListener);
  });

  it("Fails if player is already in a game", async () => {
    try {
      // Try to join game again
      await program.methods
        .joinGame()
        .accounts({
          player: playerKeypair.publicKey,
        })
        .signers([playerKeypair])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("PlayerAlreadyJoinedGame");
      return;
    }
    expect.fail("Expected an error but none was thrown");
  });
});
