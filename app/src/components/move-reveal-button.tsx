import { useState } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useProgram, useSwitchboardProgramPromise } from "@/hooks/useProgram";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import * as sb from "@switchboard-xyz/on-demand";
import { Transaction } from "@solana/web3.js";

export const MoveRevealButton = () => {
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const program = useProgram();
  const { playerState } = useBlockrunners();
  const switchboardProgramPromise = useSwitchboardProgramPromise();

  const handleMoveReveal = async () => {
    if (!publicKey || !program || !playerState || !playerState.randomnessAccount || !wallet) {
      console.error("Missing required state for move reveal");
      return;
    }

    const randomnessAccountAddress = playerState.randomnessAccount;

    setIsLoading(true);

    try {
      const isLocalnet =
        connection.rpcEndpoint.includes("localhost") ||
        connection.rpcEndpoint.includes("127.0.0.1");

      if (isLocalnet) {
        console.log("Running on localnet - using mock randomness reveal");

        // Get latest blockhash for transaction
        const latestBlockHash = await connection.getLatestBlockhash();

        // Create only the blockrunners reveal instruction (no switchboard reveal needed)
        const blockrunnersRevealIx = await program.methods
          .moveReveal()
          .accounts({
            player: publicKey,
            randomnessAccount: randomnessAccountAddress,
          })
          .instruction();

        // Create transaction
        const tx = new Transaction({
          feePayer: publicKey,
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        });

        // Add only the blockrunners instruction
        tx.add(blockrunnersRevealIx);

        // Sign transaction using wallet adapter
        const signedTx = await wallet.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        console.log("Localnet move reveal transaction sent", signature);

        // Wait to confirm the transaction
        const confirmResult = await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature,
        });

        if (confirmResult) {
          console.log("Localnet move reveal transaction was confirmed");
        }

        return;
      }

      // Original switchboard logic for devnet/mainnet
      const switchboardProgram = await switchboardProgramPromise;
      if (!switchboardProgram) {
        console.error("Switchboard program not available");
        setIsLoading(false);
        return;
      }

      // Create a Randomness instance from the public key
      const randomness = new sb.Randomness(switchboardProgram, randomnessAccountAddress);

      // Reveal randomness instruction
      const revealIx = await randomness.revealIx();

      // Blockrunners program reveal instruction
      const blockrunnersRevealIx = await program.methods
        .moveReveal()
        .accounts({
          player: publicKey,
          randomnessAccount: randomnessAccountAddress,
        })
        .instruction();

      // Get latest blockhash for transaction
      const latestBlockHash = await connection.getLatestBlockhash();

      // Create transaction
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });

      // Add instructions
      tx.add(revealIx, blockrunnersRevealIx);

      // Sign transaction using wallet adapter
      const signedTx = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      console.log("Randomness reveal transaction sent", signature);

      // Wait to confirm the transaction
      const confirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });

      if (confirmResult) {
        console.log("Randomness reveal transaction was confirmed");
      }
    } catch (err) {
      console.error("Move reveal error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleMoveReveal} disabled={isLoading} variant="primary">
      {isLoading ? "Loading..." : "Reveal Move Result"}
    </Button>
  );
};
