import { useState, useEffect, ReactNode } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { gameStatePDA, getPlayerStatePDA } from "../lib/constants";
import type { GameState, PlayerState, SocialFeedEvent } from "../types/types";
import { BlockrunnersContext } from "../hooks/useBlockrunners";
import { useProgram, useSwitchboardProgram } from "@/hooks/useProgram";
import * as sb from "@switchboard-xyz/on-demand";
import { setupQueue } from "@/lib/utils";

export const computeUnitPrice = 100_000;
export const computeUnitLimitMultiple = 1.3;
export const COMMITMENT = "processed";

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);
  const [socialFeeds, setSocialFeeds] = useState<SocialFeedEvent[]>([]);
  const [randomnessAccountAddress, setRandomnessAccountAddress] = useState<PublicKey | null>(null);

  const program = useProgram();
  const { switchboardProgram } = useSwitchboardProgram();

  // Get GameState on load
  useEffect(() => {
    if (!program) return;

    // Set up subscription to GameState PDA
    const gameSubscriptionId = connection.onAccountChange(gameStatePDA, (accountInfo) => {
      console.log("GameState changed", accountInfo.data);
      setGameState(program.coder.accounts.decode<GameState>("gameState", accountInfo.data));
    });

    // Set up subscription to SocialFeed PDA
    const emitLogSubscriptionId = program.addEventListener(
      "socialFeedEvent", // TODO: Any other events?
      (event) => {
        console.log("Event Data:", event);
        setSocialFeeds((prevState) => {
          return [...prevState, event];
        });
      }
    );

    // Fetch GameState PDA initially
    program.account.gameState
      .fetchNullable(gameStatePDA)
      .then((data) => {
        if (data) {
          console.log("GameState fetched", data);
          setGameState(data as GameState);
        } else {
          console.log("GameState does not exist yet - may need initialization");
        }
      })
      .catch((error) => {
        console.log("GameState fetch error", error.message);
      });

    return () => {
      connection.removeAccountChangeListener(gameSubscriptionId);
      program.removeEventListener(emitLogSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  // Get PlayerState upon public key change
  useEffect(() => {
    setPlayerState(null);
    setPlayerStatePDA(null);

    if (!program || !wallet?.publicKey) return;

    // Determine PlayerState PDA address
    const pda = getPlayerStatePDA(wallet.publicKey);
    setPlayerStatePDA(pda);

    // Set up subscription to PlayerState PDA
    const playerSubscriptionId = connection.onAccountChange(pda, (accountInfo) => {
      console.log("PlayerState changed", accountInfo.data);
      setPlayerState(program.coder.accounts.decode<PlayerState>("playerState", accountInfo.data));
    });

    // Fetch PlayerState PDA initially
    program.account.playerState
      .fetchNullable(pda)
      .then((data) => {
        if (data) {
          console.log("PlayerState fetched", data);
          setPlayerState(data as PlayerState);
        } else {
          console.log("PlayerState does not exist yet - may need initialization");
        }
      })
      .catch((error) => {
        console.log("PlayerState fetch error", error.message);
      });

    // Cleanup subscriptions
    return () => {
      connection.removeAccountChangeListener(playerSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, wallet?.publicKey]);

  // Instruction: Initialize game
  const initializeGame = async () => {
    if (!program) return;
    if (gameState) {
      console.error("Initialize game: GameState already exists");
      return;
    }

    if (!wallet?.publicKey) {
      console.error("Initialize game: Wallet not found");
      return;
    }

    program.methods
      .initializeGame()
      .accounts({
        admin: wallet.publicKey,
      })
      .rpc()
      .then((tx) => {
        console.log("Initialize game: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Initialize game:", err);
      });
  };

  // Instruction: Initialize player
  const initializePlayer = async () => {
    if (!program) return;

    console.log("Initialize player: Wallet", wallet?.publicKey);
    console.log("Initialize player: PlayerStatePDA", playerStatePDA);
    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Initialize player: Wallet or PlayerStatePDA not found");
      return;
    }

    try {
      // Initialize the player account - this will first attempt to reveal randomness
      // but it's okay if it's not ready yet
      await program.methods
        .initializePlayer()
        .accounts({
          player: wallet.publicKey,
        })
        .rpc();

      console.log("Player initialized successfully", playerStatePDA);
    } catch (error) {
      console.error("Error in initialize player flow:", error);
    }
  };

  // Create randomness account
  const moveRequest = async () => {
    if (!program || !wallet?.publicKey || !playerStatePDA) {
      console.error("Create randomness account: Wallet not connected or program not available");
      return;
    }

    try {
      const rngKeypair = Keypair.generate();

      if (!switchboardProgram) {
        console.error("Switchboard program not available");
        return;
      }

      // Create randomness account
      const queue = await setupQueue(switchboardProgram);
      console.log("Queue:", queue.toString());
      const [randomnessAccount, createRandomnessIx] = await sb.Randomness.create(
        switchboardProgram,
        rngKeypair,
        queue
      );
      console.log("Created randomness account", randomnessAccount.pubkey.toString());
      setRandomnessAccountAddress(randomnessAccount.pubkey);

      // Create randomness initialization transaction
      const createRandomnessTx = await sb.asV0Tx({
        connection: switchboardProgram.provider.connection,
        ixs: [createRandomnessIx],
        payer: wallet.publicKey,
        signers: [rngKeypair], // Wallet will be added as signer by wallet adapter
        computeUnitPrice: computeUnitPrice,
        computeUnitLimitMultiple: computeUnitLimitMultiple,
      });
      console.log("Randomness initialization transaction", createRandomnessTx);

      // Sign and send randomness initialization transaction using wallet adapter
      const createRandomnessSig = await sendTransactionWithWallet(createRandomnessTx);
      if (!createRandomnessSig) {
        console.error("Error sending randomness initialization transaction");
        return;
      }
      console.log("Randomness initialization transaction sent", createRandomnessSig);

      // Wait to confirm the randomness initialization transaction
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: createRandomnessSig,
      });
      console.log("Randomness initialization transaction confirmed");

      // Commit randomness instruction
      const commitIx = await randomnessAccount.commitIx(queue);

      // Blockrunners program request instruction
      const blockrunnersRequestIx = await program.methods
        .moveCommit(
          { right: {} },
          {
            shield: false,
            doubler: false,
            swift: false,
          }
        )
        .accounts({
          player: wallet.publicKey,
          randomnessAccount: randomnessAccount.pubkey,
        })
        .instruction();

      // Create transaction with both instructions
      const commitTx = await sb.asV0Tx({
        connection,
        ixs: [commitIx, blockrunnersRequestIx],
        payer: wallet.publicKey,
        signers: [], // Wallet will be added by wallet adapter
        computeUnitPrice: computeUnitPrice,
        computeUnitLimitMultiple: computeUnitLimitMultiple,
      });
      console.log("Randomness commit transaction", commitTx);

      // Send the commit transaction
      const commitSig = await sendTransactionWithWallet(commitTx);
      if (!commitSig) {
        console.error("Error sending randomness commit transaction");
        return;
      }
      console.log("Randomness commit transaction sent", commitSig);

      // Extract and filter logs
      const txDetails = await connection.getTransaction(commitSig, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      const logs = txDetails?.meta?.logMessages
        ?.filter((log) => log.includes("Program log:"))
        .map((log) => log.replace("Program log: ", ""));
      console.log("Logs:", logs);
      console.log("Full tx:", txDetails);

      // Wait to confirm the randomness commit transaction
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: commitSig,
      });
      console.log("Randomness commit transaction confirmed");
    } catch (error) {
      console.error("Error requesting randomness:", error);
    }
  };

  const moveReveal = async () => {
    if (!program || !wallet?.publicKey || !randomnessAccountAddress || !playerStatePDA) {
      console.error("Reveal randomness: Wallet not connected or program not available");
      return;
    }

    try {
      if (!switchboardProgram) {
        console.error("Switchboard program not available");
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
          player: wallet.publicKey,
          randomnessAccount: randomnessAccountAddress,
        })
        .instruction();

      // Create transaction with both instructions
      const revealTx = await sb.asV0Tx({
        connection: switchboardProgram.provider.connection,
        ixs: [revealIx, blockrunnersRevealIx],
        payer: wallet.publicKey,
        signers: [], // Wallet will be added by wallet adapter
        computeUnitPrice: computeUnitPrice,
        computeUnitLimitMultiple: computeUnitLimitMultiple,
      });

      // Send the reveal transaction
      const revealSig = await sendTransactionWithWallet(revealTx);
      if (!revealSig) {
        console.error("Error sending randomness reveal transaction");
        return;
      }
      console.log("Randomness reveal transaction sent", revealSig);

      // Wait to confirm the randomness reveal transaction
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: revealSig,
      });
      console.log("Randomness reveal transaction confirmed");
    } catch (error) {
      console.error("Error revealing randomness:", error);
    }
  };

  // Helper function to send transaction using wallet adapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTransactionWithWallet = async (transaction: any) => {
    if (!wallet?.signTransaction) {
      console.error("Wallet doesn't support signTransaction");
      return null;
    }

    try {
      // Sign with the wallet adapter
      const signedTx = await wallet.signTransaction(transaction);
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      return signature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      return null;
    }
  };

  // Instruction: Purchase ciphers
  const purchaseCiphers = async (amount: number) => {
    if (!program) return;

    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Purchase ciphers: Wallet or PlayerStatePDA not found");
      return;
    }

    program.methods
      .purchaseCiphers(new BN(amount))
      .accounts({
        player: wallet.publicKey,
      })
      .rpc()
      .then((tx) => {
        console.log("Purchase ciphers: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Purchase ciphers:", err);
      });
  };

  const value = {
    program,
    gameState,
    playerState,
    gameStatePDA,
    playerStatePDA,
    socialFeeds,
    initializeGame,
    initializePlayer,
    purchaseCiphers,
    moveRequest,
    moveReveal,
  };

  return <BlockrunnersContext.Provider value={value}>{children}</BlockrunnersContext.Provider>;
}

export default BlockrunnersProvider;
