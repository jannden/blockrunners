import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { 
  GAME_STATE_SEED, 
  PLAYER_STATE_SEED,
  SOCIAL_FEED_SEED
} from "./helpers/constants";
import { airdropSol } from "./helpers/utils";

describe("Get Game Information", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Keypairs
  const adminKeypair = Keypair.generate();
  const playerKeypair = Keypair.generate();

  // PDAs
  const [gameStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(GAME_STATE_SEED)],
    program.programId
  );

  const [playerStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PLAYER_STATE_SEED), playerKeypair.publicKey.toBuffer()],
    program.programId
  );

  const [socialFeedPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SOCIAL_FEED_SEED)],
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
          gameState: gameStatePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("Game initialization transaction signature", initGameTx);
    }

    // Initialize social feed if not already initialized
    const socialFeed = await program.account.socialFeed.fetchNullable(socialFeedPda);
    if (!socialFeed) {
      const initSocialFeedTx = await program.methods
        .initializeSocialFeed()
        .accounts({
          admin: adminKeypair.publicKey,
          socialFeed: socialFeedPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("Social feed initialization transaction signature", initSocialFeedTx);
    }

    // Initialize player if not already initialized
    const playerState = await program.account.playerState.fetchNullable(playerStatePda);
    if (!playerState) {
      const initPlayerTx = await program.methods
        .initializePlayer()
        .accounts({
          player: playerKeypair.publicKey,
          playerState: playerStatePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([playerKeypair])
        .rpc();

      console.log("Player initialization transaction signature", initPlayerTx);
    }
  });

  it("Can retrieve game state information", async () => {
    // Call the get_game_state instruction
    await program.methods
      .getGameState()
      .accounts({
        gameState: gameStatePda,
      })
      .rpc();

    // Fetch the game state directly
    const gameState = await program.account.gameState.fetch(gameStatePda);

    // Verify game state properties
    expect(gameState.authority).to.not.be.null;
    expect(gameState.prizePool).to.not.be.null;
    expect(gameState.pathLength).to.equal(20); // Initial path length
  });

  it("Can retrieve player state information", async () => {
    // Call the get_player_state instruction
    await program.methods
      .getPlayerState()
      .accounts({
        player: playerKeypair.publicKey,
        playerState: playerStatePda,
      })
      .signers([playerKeypair])
      .rpc();

    // Fetch the player state directly
    const playerState = await program.account.playerState.fetch(playerStatePda);

    // Verify player state properties
    expect(playerState.ciphers).to.not.be.null;
    expect(playerState.cards.toNumber()).to.equal(1); // Initial cards amount
    expect(playerState.position).to.equal(0); // Initial position
  });

  it("Can retrieve social feed information", async () => {
    // Call the get_social_feed instruction
    await program.methods
      .getSocialFeed()
      .accounts({
        socialFeed: socialFeedPda,
      })
      .rpc();

    // Fetch the social feed directly
    const socialFeed = await program.account.socialFeed.fetch(socialFeedPda);

    // Verify social feed properties
    expect(socialFeed.authority).to.not.be.null;
    expect(socialFeed.events).to.be.an('array');
  });
}); 