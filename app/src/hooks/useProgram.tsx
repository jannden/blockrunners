import { Program, Idl } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "./useAnchorProvider";
import { PublicKey } from "@solana/web3.js";
import { useMemo, useEffect } from "react";

const PROGRAM_ID = new PublicKey(
  "7qrynX2FWke2vxnp8JWxUzjU3vQpsCyJWSjEqce3iuJh"
);

/**
 * Hook to get the Anchor Program instance
 * @returns The Anchor Program instance, properly configured with a provider for transactions
 */
export function useProgram() {
  const { connection } = useConnection();
  const provider = useAnchorProvider();

  // Debug output
  useEffect(() => {
    console.log("Provider status:", !!provider);
    console.log("Connection status:", !!connection);
    console.log("Using program ID:", PROGRAM_ID.toString());
  }, [provider, connection]);

  // 여기에 useMemo를 다시 추가하여 무한 렌더링 방지
  return useMemo(() => {
    if (!provider) {
      console.log("Provider not available, returning null program");
      return null;
    }

    try {
      console.log("Creating Program with ID:", PROGRAM_ID.toString());

      // 프로그램 생성 전에 연결 상태 확인
      if (!connection) {
        console.error("Connection is not available");
        return null;
      }

      // 연결 상태 확인을 로그로 출력
      console.log("Connection endpoint:", connection.rpcEndpoint);
      console.log("Connection status:", connection.commitment);

      // IDL을 더 간단하게 수정 - camelCase로 통일
      const simplifiedIdl: Idl = {
        version: "0.1.0",
        name: "blockrunners",
        instructions: [
          {
            name: "initializeGame",
            accounts: [
              { name: "admin", isMut: true, isSigner: true },
              { name: "game_state", isMut: true, isSigner: false },
              { name: "system_program", isMut: false, isSigner: false },
            ],
            args: [],
          },
          {
            name: "initializePlayer",
            accounts: [
              { name: "player", isMut: true, isSigner: true },
              { name: "player_state", isMut: true, isSigner: false },
              { name: "system_program", isMut: false, isSigner: false },
            ],
            args: [],
          },
          {
            name: "makeMove",
            accounts: [
              { name: "player", isMut: false, isSigner: true },
              { name: "player_state", isMut: true, isSigner: false },
              { name: "game_state", isMut: false, isSigner: false },
            ],
            args: [
              { name: "direction", type: { defined: "PathDirection" } },
              { name: "card_usage", type: { defined: "CardUsage" } },
            ],
          },
          {
            name: "purchaseCiphers",
            accounts: [
              { name: "player", isMut: true, isSigner: true },
              { name: "player_state", isMut: true, isSigner: false },
              { name: "game_state", isMut: true, isSigner: false },
              { name: "system_program", isMut: false, isSigner: false },
            ],
            args: [{ name: "amount", type: "u64" }],
          },
        ],
        accounts: [
          {
            name: "GameState",
            type: {
              kind: "struct",
              fields: [
                { name: "authority", type: "publicKey" },
                { name: "prize_pool", type: "u64" },
                { name: "path_length", type: "u8" },
                {
                  name: "game_events",
                  type: { vec: { defined: "SocialFeedEvent" } },
                },
              ],
            },
          },
          {
            name: "PlayerState",
            type: {
              kind: "struct",
              fields: [
                { name: "player", type: "publicKey" },
                { name: "ciphers", type: "u64" },
                { name: "cards", type: { vec: { defined: "Card" } } },
                { name: "position", type: "u8" },
                { name: "bump", type: "u8" },
                {
                  name: "player_events",
                  type: { vec: { defined: "SocialFeedEvent" } },
                },
                { name: "in_game", type: "bool" },
              ],
            },
          },
        ],
        types: [
          {
            name: "PathDirection",
            type: {
              kind: "enum",
              variants: [{ name: "Left" }, { name: "Right" }],
            },
          },
          {
            name: "Card",
            type: {
              kind: "enum",
              variants: [
                { name: "Shield" },
                { name: "Doubler" },
                { name: "Swift" },
              ],
            },
          },
          {
            name: "CardUsage",
            type: {
              kind: "struct",
              fields: [
                { name: "shield", type: "bool" },
                { name: "doubler", type: "bool" },
                { name: "swift", type: "bool" },
              ],
            },
          },
          {
            name: "SocialFeedEvent",
            type: {
              kind: "struct",
              fields: [
                {
                  name: "event_type",
                  type: { defined: "SocialFeedEventType" },
                },
                { name: "message", type: "string" },
                { name: "timestamp", type: "i64" },
              ],
            },
          },
          {
            name: "SocialFeedEventType",
            type: {
              kind: "enum",
              variants: [
                { name: "CardUsed" },
                { name: "CiphersPurchased" },
                { name: "GameWon" },
                { name: "PlayerCardCollected" },
                { name: "PlayerJoined" },
                { name: "PlayerCardsMaxRange" },
                { name: "PlayerMoved" },
              ],
            },
          },
        ],
      };

      console.log("Creating program with simplified IDL");
      const program = new Program(simplifiedIdl, PROGRAM_ID, provider);

      console.log("✅ Program instance created successfully:", !!program);

      return program;
    } catch (error) {
      console.error("❌ Error creating Program instance:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return null;
    }
  }, [connection, provider]);
}
