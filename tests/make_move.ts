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
        const socialFeedEventListener = program.addEventListener("socialFeedEvent", event => {
            console.log("Make move events:", event.message);
        });

        // Fetch player state to get the current position
        const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
        const initialPosition = playerStateBefore.position;
        console.log(`Player position before move: ${initialPosition}`);
        
        // Make a move (direction doesn't matter, the program will generate the correct direction)
        const direction = { left: {} }; // Just pick a direction
        console.log(`Direction chosen: ${JSON.stringify(direction)}`);

        // Make the move
        const tx = await program.methods
            .makeMove(direction, [])
            .accounts({
                player: playerKeypair.publicKey,
                playerState: playerStatePda,
                gameState: gameStatePda,
            })
            .signers([playerKeypair])
            .rpc();

        const logs = await getMsgLogs(provider, tx);
        console.log("Make move logs -> ", logs);

        // Fetch player state after the move
        const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
        console.log(`Player position after move: ${playerStateAfter.position}`);

        // If the position increased, it was a correct move
        if (playerStateAfter.position > initialPosition) {
            console.log("Correct move! Position increased.");
            
            // Verify position was incremented
            expect(playerStateAfter.position).to.equal(initialPosition + 1);
            
            // Verify player cards were increased
            expect(playerStateAfter.cards.length).to.equal(
                playerStateBefore.cards.length + 1
            );
        } else {
            console.log("Incorrect move! Position reset to 0.");
            
            // Verify position was reset to 0
            expect(playerStateAfter.position).to.equal(0);
            
            // Verify player cards did not increase
            expect(playerStateAfter.cards.length).to.equal(
                playerStateBefore.cards.length
            );
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
            console.log(`Move ${i+1}: Player position before move: ${currentPosition}`);
            
            // Make a move (direction doesn't matter, the program will generate the correct direction)
            const direction = { left: {} }; // Just pick a direction
            console.log(`Move ${i+1}: Direction chosen: ${JSON.stringify(direction)}`);

            // Make the move
            const tx = await program.methods
                .makeMove(direction, [])
                .accounts({
                    player: playerKeypair.publicKey,
                    playerState: playerStatePda,
                    gameState: gameStatePda,
                })
                .signers([playerKeypair])
                .rpc();

            // Fetch player state after the move
            const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
            
            // If the position changed, it was correct
            if (playerStateAfter.position > currentPosition) {
                console.log(`Move ${i+1}: Correct! Advanced to position ${playerStateAfter.position}`);
            } else {
                console.log(`Move ${i+1}: Incorrect. Reset to position ${playerStateAfter.position}`);
                // Break the loop if we got reset
                break;
            }
        }
    });

    it("Tests incorrect move behavior", async () => {
        // Fetch player state to get the current position
        const playerStateBefore = await program.account.playerState.fetch(playerStatePda);
        const currentPosition = playerStateBefore.position;
        console.log(`Player position before move: ${currentPosition}`);
        
        // Make a move (direction doesn't matter, the program will generate the correct direction)
        const direction = { right: {} }; // Just pick a direction
        console.log(`Direction chosen: ${JSON.stringify(direction)}`);

        // Make the move
        const tx = await program.methods
            .makeMove(direction, [])
            .accounts({
                player: playerKeypair.publicKey,
                playerState: playerStatePda,
                gameState: gameStatePda,
            })
            .signers([playerKeypair])
            .rpc();

        const logs = await getMsgLogs(provider, tx);
        console.log("Make move logs -> ", logs);

        // Fetch player state after the move
        const playerStateAfter = await program.account.playerState.fetch(playerStatePda);
        console.log(`Player position after move: ${playerStateAfter.position}`);

        // If the position didn't increase, it was an incorrect move
        if (playerStateAfter.position <= currentPosition) {
            console.log("Incorrect move! Position reset to 0.");
            
            // Verify position was reset to 0
            expect(playerStateAfter.position).to.equal(0);
            
            // Verify player cards did not increase
            expect(playerStateAfter.cards.length).to.equal(
                playerStateBefore.cards.length
            );
        } else {
            console.log("Correct move! Position increased.");
            
            // Verify position was incremented
            expect(playerStateAfter.position).to.equal(currentPosition + 1);
            
            // Verify player cards were increased
            expect(playerStateAfter.cards.length).to.equal(
                playerStateBefore.cards.length + 1
            );
        }
    });

    it("Allows a player to use a shield card to prevent reset on wrong move", async () => {
        // First ensure player has a shield card
        let playerState = await program.account.playerState.fetch(playerStatePda);
        
        // This assumes there's an instruction to add cards to player for testing
        // For this test, we'll assume the player has a shield card at index 0
        const hasShield = playerState.cards.some(card => card.shield !== undefined);
        if (!hasShield) {
            console.log("Test requires a shield card - skipping");
            return;
        }
        
        const currentPosition = playerState.position;
        console.log(`Player position before wrong move with shield: ${currentPosition}`);
        
        // Get the correct direction
        const correctDirection = playerState.path[currentPosition];
        
        // Choose wrong direction
        let wrongDirection;
        if (correctDirection.left !== undefined) {
            wrongDirection = { right: {} };
        } else {
            wrongDirection = { left: {} };
        }
        
        // Make wrong move but use shield card
        const tx = await program.methods
            .makeMove(wrongDirection, [{ shield: {} }])
            .accounts({
                player: playerKeypair.publicKey,
                playerState: playerStatePda,
            })
            .signers([playerKeypair])
            .rpc();
            
        const logs = await getMsgLogs(provider, tx);
        console.log("Shield card move logs -> ", logs);
        
        // Check position was maintained
        playerState = await program.account.playerState.fetch(playerStatePda);
        expect(playerState.position).to.equal(currentPosition);
    });
    
    it("Allows a player to use multiple cards in a single move", async () => {
        // This test assumes player has all three card types
        let playerState = await program.account.playerState.fetch(playerStatePda);
        const hasAllCards = 
            playerState.cards.some(card => card.shield !== undefined) &&
            playerState.cards.some(card => card.doubler !== undefined) &&
            playerState.cards.some(card => card.swift !== undefined);
            
        if (!hasAllCards) {
            console.log("Test requires all card types - skipping");
            return;
        }
        
        const correctDirection = playerState.path[playerState.position];
        const cardsBefore = playerState.cards.length;
        const ciphersBefore = playerState.ciphers.toNumber();
        
        // Use all three cards with correct move
        const tx = await program.methods
            .makeMove(correctDirection, [
                { shield: {} },
                { doubler: {} },
                { swift: {} }
            ])
            .accounts({
                player: playerKeypair.publicKey,
                playerState: playerStatePda,
            })
            .signers([playerKeypair])
            .rpc();
            
        const logs = await getMsgLogs(provider, tx);
        console.log("Multiple cards move logs -> ", logs);
        
        // Check effects: position +1, cards -3 (used) +2 (from doubler), ciphers -4 (base + 3 cards) +2 (from swift)
        playerState = await program.account.playerState.fetch(playerStatePda);
        
        // Position should advance
        expect(playerState.position).to.be.above(0);
        
        // We should have used 3 cards but gained 2 from doubler
        expect(playerState.cards.length).to.equal(cardsBefore - 3 + 2);
        
        // We should have used 4 ciphers (base + 3 cards) but got 2 back from swift
        expect(playerState.ciphers).to.equal(ciphersBefore - 4 + 2);
    });
});