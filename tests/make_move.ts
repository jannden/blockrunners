import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { Blockrunners } from "../target/types/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./helpers/constants";
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
            
        console.log("Path initialized for player");

        // Verify player has a path with just the first step
        const playerState = await program.account.playerState.fetch(playerStatePda);
        expect(playerState.path.length).to.equal(1);
        console.log("Player path at start:", playerState.path);
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
        console.log("Player path after correct move:", playerStateAfter.path);

        // Verify position was incremented
        expect(playerStateAfter.position).to.equal(initialPosition + 1);
        
        // The next direction may have been generated if this was the first move
        if (playerStateAfter.position > 0) {
            // We should have at least position + 1 steps in the path
            // (or the program will generate one when we make the next move)
            console.log(`Path length after move: ${playerStateAfter.path.length}`);
        }
    });

    it("Makes multiple correct moves", async () => {
        // Make three more correct moves in a row to test path generation
        for (let i = 0; i < 3; i++) {
            // Fetch player state to get the current path and position
            const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
            const currentPosition = playerStateBefore.position;
            console.log(`Move ${i+1}: Player position before move: ${currentPosition}`);
            
            // If we need a new direction generated, make any move
            // The contract will generate the next direction
            let correctDirection;
            if (currentPosition >= playerStateBefore.path.length) {
                console.log("Current position is beyond path length, making a move to generate next step");
                correctDirection = { left: {} }; // Just pick a direction, the program will generate a path
            } else {
                // Otherwise use the correct direction from the path
                correctDirection = playerStateBefore.path[currentPosition];
            }
            
            console.log(`Move ${i+1}: Direction chosen: ${JSON.stringify(correctDirection)}`);

            // Make the move
            const tx = await program.methods
                .makeMove(correctDirection)
                .accounts({
                    player: playerKeypair.publicKey,
                    playerState: playerStatePda,
                })
                .signers([playerKeypair])
                .rpc();

            // Fetch player state after the move
            const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
            
            // If the position changed, it was correct
            if (playerStateAfter.position > currentPosition) {
                console.log(`Move ${i+1}: Correct! Advanced to position ${playerStateAfter.position}`);
                console.log(`Move ${i+1}: Path after move: ${JSON.stringify(playerStateAfter.path)}`);
            } else {
                console.log(`Move ${i+1}: Incorrect. Reset to position ${playerStateAfter.position}`);
                console.log(`Move ${i+1}: New path generated: ${JSON.stringify(playerStateAfter.path)}`);
                // Break the loop if we got reset
                break;
            }
        }
    });

    it("Resets player position with incorrect choice", async () => {
        // Fetch player state to get the current path and position
        const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
        const currentPosition = playerStateBefore.position;
        console.log(`Player position before wrong move: ${currentPosition}`);
        
        // Get the correct direction for the current position
        // If we're at the end of the path, make a move to generate the next step first
        if (currentPosition >= playerStateBefore.path.length) {
            console.log("Making a move to generate the next step");
            const genTx = await program.methods
                .makeMove({ left: {} }) // Just pick a direction to trigger generation
                .accounts({
                    player: playerKeypair.publicKey,
                    playerState: playerStatePda,
                })
                .signers([playerKeypair])
                .rpc();
                
            // Fetch the updated player state
            const updatedState = await program.account.playerState.fetch(playerStatePda);
            console.log("Path after generation:", updatedState.path);
        }
        
        // Fetch the current state again
        const currentState = await program.account.playerState.fetch(playerStatePda);
        const correctDirection = currentState.path[currentState.position];
        console.log(`Correct direction: ${JSON.stringify(correctDirection)}`);
        
        // Choose the wrong direction (opposite of the correct one)
        let wrongDirection;
        if (correctDirection.left !== undefined) {
            wrongDirection = { right: {} };
        }
        else if (correctDirection.right !== undefined) {
            wrongDirection = { left: {} };
        }
        else {
            // Handle other direction types or throw an error
            throw new Error("Unexpected direction type: " + JSON.stringify(correctDirection));
        }
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
        console.log("New path after wrong move:", playerStateAfter.path);

        // Verify position was reset to 0
        expect(playerStateAfter.position).to.equal(0);
        
        // Verify a new path was generated with at least one step
        expect(playerStateAfter.path.length).to.be.at.least(1);
    });
});
