import { useState } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { RoundButton } from "./ui/round-button";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useProgram, useSwitchboardProgramPromise } from "@/hooks/useProgram";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import * as sb from "@switchboard-xyz/on-demand";
import { PathDirection } from "@/lib/types";
import { Keypair, Transaction } from "@solana/web3.js";
import { setupQueue } from "@/lib/utils";

interface MoveCommitButtonsProps {
  nextMoveCost: number;
  onCostInfoClick: () => void;
}

export const MoveCommitButtons = ({ nextMoveCost, onCostInfoClick }: MoveCommitButtonsProps) => {
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const program = useProgram();
  const { cardUsage, playerState } = useBlockrunners();
  const switchboardProgramPromise = useSwitchboardProgramPromise();

  // Check if player has enough ciphers for the move
  const playerCiphers = playerState?.ciphers ? Number(playerState.ciphers) : 0;
  const hasEnoughCiphers = playerCiphers >= nextMoveCost;

  const handleMoveCommit = async (direction: PathDirection) => {
    if (!publicKey || !program || !wallet || !hasEnoughCiphers) {
      console.error("Missing required state for move commit or not enough ciphers");
      return;
    }

    setIsLoading(true);

    try {
      const switchboardProgram = await switchboardProgramPromise;
      if (!switchboardProgram) {
        console.error("Switchboard program not available");
        setIsLoading(false);
        return;
      }

      // Create randomness account
      const rngKeypair = Keypair.generate();
      const queue = await setupQueue(switchboardProgram);
      console.log("Queue:", queue.toString());
      const [randomnessAccount, createRandomnessIx] = await sb.Randomness.create(
        switchboardProgram,
        rngKeypair,
        queue
      );
      console.log("Created randomness account", randomnessAccount.pubkey.toString());

      // Create a regular Transaction instead of a VersionedTransaction
      // This is because VersionedTransaction doesn't support partialSign
      const latestBlockHash = await connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });

      // Add the instruction to create the randomness account
      tx.add(createRandomnessIx);

      // Sign with wallet and rngKeypair
      const signedTx = await wallet.signTransaction(tx);
      signedTx.partialSign(rngKeypair);

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log("Randomness initialization transaction sent", signature);

      // Wait to confirm the randomness initialization transaction
      const initConfirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });

      if (initConfirmResult) {
        console.log("Randomness initialization transaction confirmed");
      }

      // Commit randomness instruction
      const commitIx = await randomnessAccount.commitIx(queue);

      // Blockrunners program request instruction
      const blockrunnersRequestIx = await program.methods
        .moveCommit(direction, cardUsage)
        .accounts({
          player: publicKey,
          randomnessAccount: randomnessAccount.pubkey,
        })
        .instruction();

      // Create a new transaction for the commit
      const commitTx = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });

      // Add instructions
      commitTx.add(commitIx, blockrunnersRequestIx);

      // Sign with the anchor wallet and send the commit transaction
      const signedCommitTx = await wallet.signTransaction(commitTx);
      const commitSig = await connection.sendRawTransaction(signedCommitTx.serialize());
      console.log("Randomness commit transaction sent", commitSig);

      // Wait to confirm the randomness commit transaction
      const commitConfirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: commitSig,
      });

      if (commitConfirmResult) {
        console.log("Randomness commit transaction confirmed");
      }
    } catch (err) {
      console.error("Move commit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Message to display if player doesn't have enough ciphers
  const notEnoughCiphersMessage = !hasEnoughCiphers ? `Need ${nextMoveCost} ciphers` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {!hasEnoughCiphers && (
        <div className="flex items-center justify-center p-2 bg-red-100 border border-red-300 text-red-700 rounded-md">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">
            Not enough ciphers! You need {nextMoveCost}, but have {playerCiphers}.
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => handleMoveCommit({ left: {} })}
          disabled={isLoading || !hasEnoughCiphers}
          variant="primary"
          title={notEnoughCiphersMessage}
        >
          <ArrowLeft className="h-8 w-8 mr-2" />
          <span className="font-bold text-lg">LEFT</span>
        </Button>

        <RoundButton
          onClick={onCostInfoClick}
          disabled={!hasEnoughCiphers}
          title={
            hasEnoughCiphers ? "Move cost" : `Need ${nextMoveCost - playerCiphers} more ciphers`
          }
        >
          {nextMoveCost}
        </RoundButton>

        <Button
          onClick={() => handleMoveCommit({ right: {} })}
          disabled={isLoading || !hasEnoughCiphers}
          variant="primary"
          title={notEnoughCiphersMessage}
        >
          <span className="font-bold text-lg">RIGHT</span>
          <ArrowRight className="h-8 w-8 ml-2" />
        </Button>
      </div>
    </div>
  );
};
