import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, INITIAL_PATH_LENGTH, PLAYER_STATE_SEED } from "./helpers/constants";
import { airdropSol, getMsgLogs } from "./helpers/utils";

describe("Make Move", () => {
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

        // Purchase ciphers to generate path
        const ciphersToPurchase = 5;
        const tx = await program.methods
            .purchaseCiphers(new anchor.BN(ciphersToPurchase))
            .accounts({
                player: playerKeypair.publicKey,
            })
            .signers([playerKeypair])
            .rpc();
            
        console.log("Path generated for player");

        // Verify player has a path
        const playerState = await program.account.playerState.fetch(playerStatePda);
        expect(playerState.path.length).to.equal(INITIAL_PATH_LENGTH);
    });

    it("Allows successful player movement with correct choice", async () => {
        // Fetch player state to get the current path and position
        const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
        const initialPosition = playerStateBefore.position;
        console.log(`Player position before move: ${initialPosition}`);
        
        // Get the correct direction for the current position
        const correctDirection = playerStateBefore.path[initialPosition];
        console.log(`Correct next direction: ${JSON.stringify(correctDirection)}`);

        // Make the correct move
        const tx = await program.methods
            .makeMove(correctDirection)
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
        console.log(`Player position after correct move: ${playerStateAfter.position}`);

        // Verify position was incremented
        expect(playerStateAfter.position).to.equal(initialPosition + 1);
    });

    it("Resets player position with incorrect choice", async () => {
        // Fetch player state to get the current path and position
        const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
        const currentPosition = playerStateBefore.position;
        console.log(`Player position before wrong move: ${currentPosition}`);
        
        // Get the correct direction for the current position
        const correctDirection = playerStateBefore.path[currentPosition];
        console.log(`Correct direction: ${JSON.stringify(correctDirection)}`);
        
        // Choose the wrong direction (opposite of the correct one)
        const wrongDirection = correctDirection.left !== undefined 
            ? { right: {} } 
            : { left: {} };
        console.log(`Wrong direction chosen: ${JSON.stringify(wrongDirection)}`);

        // Make the wrong move
        const tx = await program.methods
            .makeMove(wrongDirection)
            .accounts({
                player: playerKeypair.publicKey,
                playerState: playerStatePda,
            })
            .signers([playerKeypair])
            .rpc();

        const logs = await getMsgLogs(provider, tx);
        console.log("Make wrong move logs -> ", logs);

        // Fetch player state after the move
        const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
        console.log(`Player position after wrong move: ${playerStateAfter.position}`);

        // Verify position was reset to 0
        expect(playerStateAfter.position).to.equal(0);
    });
});
