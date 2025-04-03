import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import { useStore } from "@/lib/game-store";

export function GameInitializer() {
  const { connected, publicKey } = useWallet();
  const { program, isInitialized: isProgramInitialized } = useProgram();
  const { addToFeed } = useStore();

  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [playerStateKey, setPlayerStateKey] = useState<PublicKey | null>(null);

  // Derive the player state PDA
  useEffect(() => {
    if (!publicKey || !isProgramInitialized || !program) return;

    try {
      // Derive player state PDA
      const [playerStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_state"), publicKey.toBuffer()],
        program.programId
      );

      setPlayerStateKey(playerStatePda);
    } catch (err) {
      console.error("Error deriving player state PDA:", err);
    }
  }, [publicKey, isProgramInitialized, program]);

  // Check if player is initialized
  useEffect(() => {
    async function checkPlayerState() {
      if (!playerStateKey || !program) return;

      try {
        const playerState = await program.account.playerState.fetch(playerStateKey);

        // If we can fetch the account, it exists
        setIsPlayerInitialized(true);
        console.log("Player state found:", playerState);
      } catch (err) {
        // Account not found, player not initialized
        setIsPlayerInitialized(false);
        console.log("Player state not found, needs initialization: ", err);
      }
    }

    checkPlayerState();
  }, [playerStateKey, program]);

  // Initialize player if needed
  useEffect(() => {
    async function initializePlayer() {
      if (!connected || !publicKey || !program || !playerStateKey || isPlayerInitialized) return;

      try {
        addToFeed("Initializing player on-chain...");

        // Initialize player account
        const tx = await program.methods
          .initializePlayer()
          .accounts({
            player: publicKey,
          })
          .rpc();

        console.log("Player initialized with tx:", tx);
        addToFeed("Player successfully initialized on-chain!");
        setIsPlayerInitialized(true);
      } catch (err) {
        console.error("Error initializing player:", err);
        addToFeed("Failed to initialize player on-chain. Please try again.");
      }
    }

    initializePlayer();
  }, [connected, publicKey, program, playerStateKey, isPlayerInitialized, addToFeed]);

  // This is a utility component that doesn't render anything visible
  return null;
}
