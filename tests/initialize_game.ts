import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { airdropSol, getEventLogs, getMsgLogs, getTxDetails } from "./helpers/utils";
import { GAME_STATE_SEED, ADMIN_KEYPAIR } from "./helpers/constants";

describe("Initialize Game", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blockrunners as Program<Blockrunners>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Fixed path length for alpha
  const PATH_LENGTH = 20;

  // Keypairs
  const adminKeypair = ADMIN_KEYPAIR;

  // Game state PDA
  const [gameStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(GAME_STATE_SEED)],
    program.programId
  );

  before(async () => {
    // Airdrop SOL to the admin
    await airdropSol(provider, adminKeypair);
  });

  it("Allows admin to initialize the game", async () => {
    // Get admin balance before initialization
    const adminBalanceBefore = await provider.connection.getBalance(adminKeypair.publicKey);

    // Initialize the game if the game state account doesn't exist
    const gameStateBefore = await program.account.gameState.fetchNullable(gameStatePda);
    if (!gameStateBefore) {
      const tx = await program.methods
        .initializeGame()
        .accounts({
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();
      const txDetails = await getTxDetails(provider, tx);
      const logs = await getMsgLogs(txDetails);
      console.log("Game initialization logs -> ", logs);
      const events = await getEventLogs(txDetails);
      console.log("Game initialization events -> ", events);
    }

    // Fetch game state to verify initialization
    const gameStateAfter = await program.account.gameState.fetch(gameStatePda);

    // Verify game state was initialized correctly
    expect(gameStateAfter.prizePool.toNumber()).to.equal(0);
    expect(gameStateAfter.pathLength).to.equal(PATH_LENGTH);
  });

  it("Fails if game state account already exists", async () => {
    try {
      await program.methods
        .initializeGame()
        .accounts({
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();
    } catch (error) {
      expect(error.transactionLogs[3]).to.include("already in use");
    }
  });
});
