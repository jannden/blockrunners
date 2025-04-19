/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blockrunners.json`.
 */
export type Blockrunners = {
  address: "7Ry4KiT8BGuUJHgEXKjmeHxDTgYd25tczRiiC8nQKQ9Z";
  metadata: {
    name: "blockrunners";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "initializeGame";
      discriminator: [44, 62, 102, 247, 126, 208, 130, 215];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "gameState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 97, 109, 101, 95, 115, 116, 97, 116, 101];
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initializePlayer";
      discriminator: [79, 249, 88, 177, 220, 62, 56, 128];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101];
              },
              {
                kind: "account";
                path: "player";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "makeMove";
      discriminator: [78, 77, 152, 203, 222, 211, 208, 233];
      accounts: [
        {
          name: "player";
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101];
              },
              {
                kind: "account";
                path: "player";
              }
            ];
          };
        },
        {
          name: "gameState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 97, 109, 101, 95, 115, 116, 97, 116, 101];
              }
            ];
          };
        },
        {
          name: "randomnessAccount";
          writable: true;
        }
      ];
      args: [
        {
          name: "direction";
          type: {
            defined: {
              name: "pathDirection";
            };
          };
        },
        {
          name: "cardUsage";
          type: {
            defined: {
              name: "cardUsage";
            };
          };
        }
      ];
    },
    {
      name: "purchaseCiphers";
      discriminator: [99, 179, 154, 118, 166, 190, 214, 168];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101];
              },
              {
                kind: "account";
                path: "player";
              }
            ];
          };
        },
        {
          name: "gameState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 97, 109, 101, 95, 115, 116, 97, 116, 101];
              }
            ];
          };
        },
        {
          name: "randomnessAccount";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "tempRandRequest";
      discriminator: [113, 139, 225, 92, 32, 154, 254, 183];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101];
              },
              {
                kind: "account";
                path: "player";
              }
            ];
          };
        },
        {
          name: "randomnessAccount";
        }
      ];
      args: [];
    },
    {
      name: "tempRandReveal";
      discriminator: [236, 197, 245, 2, 182, 122, 170, 212];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101];
              },
              {
                kind: "account";
                path: "player";
              }
            ];
          };
        },
        {
          name: "randomnessAccount";
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "gameState";
      discriminator: [144, 94, 208, 172, 248, 99, 134, 120];
    },
    {
      name: "playerState";
      discriminator: [56, 3, 60, 86, 174, 16, 244, 195];
    }
  ];
  events: [
    {
      name: "socialFeedEvent";
      discriminator: [229, 17, 83, 185, 10, 200, 58, 189];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "exceedsMaxCards";
      msg: "Player used too many cards";
    },
    {
      code: 6001;
      name: "duplicateCard";
      msg: "Player used duplicate card";
    },
    {
      code: 6002;
      name: "insufficientBalance";
      msg: "Player has insufficient balance to pay";
    },
    {
      code: 6003;
      name: "insufficientCards";
      msg: "Player tried to use a card they don't have";
    },
    {
      code: 6004;
      name: "invalidCardIndex";
      msg: "Invalid card index generated";
    },
    {
      code: 6005;
      name: "negativeCiphersAmount";
      msg: "Player tries to purchase ciphers with a negative amount";
    },
    {
      code: 6006;
      name: "pathAlreadyCompleted";
      msg: "Player has already completed the path";
    },
    {
      code: 6007;
      name: "unknownError";
      msg: "Unknown Error";
    },
    {
      code: 6008;
      name: "noCardsLeft";
      msg: "No cards left to use";
    },
    {
      code: 6009;
      name: "invalidMove";
      msg: "Invalid move";
    },
    {
      code: 6010;
      name: "invalidCardSelection";
      msg: "Invalid card selection";
    },
    {
      code: 6011;
      name: "notEnoughCiphers";
      msg: "Not enough ciphers to make this move";
    },
    {
      code: 6012;
      name: "notAtEndOfPath";
      msg: "Player not at end of path yet";
    },
    {
      code: 6013;
      name: "randomnessAccountParsing";
      msg: "Failed to parse randomness account";
    },
    {
      code: 6014;
      name: "randomnessAccountParsingReveal";
      msg: "Failed to parse randomness account for reveal";
    },
    {
      code: 6015;
      name: "randomnessUnavailable";
      msg: "Randomness data is unavailable";
    },
    {
      code: 6016;
      name: "randomnessFinished";
      msg: "Randomness finished";
    },
    {
      code: 6017;
      name: "randomnessNotResolved";
      msg: "Randomness not resolved";
    },
    {
      code: 6018;
      name: "randomnessStale";
      msg: "Randomness is stale";
    },
    {
      code: 6019;
      name: "randomnessExpired";
      msg: "Randomness is expired";
    },
    {
      code: 6020;
      name: "unauthorized";
      msg: "unauthorized";
    }
  ];
  types: [
    {
      name: "card";
      type: {
        kind: "enum";
        variants: [
          {
            name: "shield";
          },
          {
            name: "doubler";
          },
          {
            name: "swift";
          }
        ];
      };
    },
    {
      name: "cardUsage";
      type: {
        kind: "struct";
        fields: [
          {
            name: "shield";
            type: "bool";
          },
          {
            name: "doubler";
            type: "bool";
          },
          {
            name: "swift";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "gameState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: ["Authority"];
            type: "pubkey";
          },
          {
            name: "prizePool";
            docs: ["The current prize pool amount in lamports"];
            type: "u64";
          },
          {
            name: "pathLength";
            docs: ["The length of the path players need to navigate"];
            type: "u8";
          },
          {
            name: "gameEvents";
            type: {
              vec: {
                defined: {
                  name: "socialFeedEvent";
                };
              };
            };
          }
        ];
      };
    },
    {
      name: "pathDirection";
      type: {
        kind: "enum";
        variants: [
          {
            name: "left";
          },
          {
            name: "right";
          }
        ];
      };
    },
    {
      name: "playerState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "player";
            type: "pubkey";
          },
          {
            name: "ciphers";
            docs: ["Number of ciphers owned"];
            type: "u64";
          },
          {
            name: "cards";
            type: {
              vec: {
                defined: {
                  name: "card";
                };
              };
            };
          },
          {
            name: "position";
            docs: ["Current block number"];
            type: "u8";
          },
          {
            name: "bump";
            docs: ["Store bump to save compute"];
            type: "u8";
          },
          {
            name: "playerEvents";
            type: {
              vec: {
                defined: {
                  name: "socialFeedEvent";
                };
              };
            };
          },
          {
            name: "inGame";
            docs: ["The player has joined the game or not"];
            type: "bool";
          },
          {
            name: "randomnessAccount";
            docs: ["Switchboard randomness account for player-specific randomness"];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "randomnessSlot";
            docs: ["The slot at which the randomness was committed"];
            type: {
              option: "u64";
            };
          },
          {
            name: "randomnessValue";
            docs: ["The randomness values generated for the player"];
            type: {
              option: "bytes";
            };
          }
        ];
      };
    },
    {
      name: "socialFeedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "eventType";
            type: {
              defined: {
                name: "socialFeedEventType";
              };
            };
          },
          {
            name: "message";
            type: "string";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "socialFeedEventType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "cardUsed";
          },
          {
            name: "ciphersPurchased";
          },
          {
            name: "gameWon";
          },
          {
            name: "playerCardCollected";
          },
          {
            name: "playerJoined";
          },
          {
            name: "playerCardsMaxRange";
          },
          {
            name: "playerMoved";
          }
        ];
      };
    }
  ];
  constants: [
    {
      name: "cardTypesCount";
      type: "u8";
      value: "3";
    },
    {
      name: "cipherCost";
      type: "u64";
      value: "1000";
    },
    {
      name: "discriminatorSize";
      type: "u8";
      value: "8";
    },
    {
      name: "gameStateSeed";
      type: "bytes";
      value: "[103, 97, 109, 101, 95, 115, 116, 97, 116, 101]";
    },
    {
      name: "initialPathLength";
      type: "u8";
      value: "20";
    },
    {
      name: "initialPrizePool";
      type: "u64";
      value: "0";
    },
    {
      name: "maxFeedEvents";
      type: "u8";
      value: "20";
    },
    {
      name: "maxRandomnessValues";
      type: "u8";
      value: "32";
    },
    {
      name: "maxTotalCards";
      type: "u8";
      value: "40";
    },
    {
      name: "playerStateSeed";
      type: "bytes";
      value: "[112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101]";
    }
  ];
};
