/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blockrunners.json`.
 */
export type Blockrunners = {
  "address": "BsPD4M38GiLBKuDSNipaw6GCfNeJ3uyRngqYBpsiEXko",
  "metadata": {
    "name": "blockrunners",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initializeGame",
      "discriminator": [
        44,
        62,
        102,
        247,
        126,
        208,
        130,
        215
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializePlayer",
      "discriminator": [
        79,
        249,
        88,
        177,
        220,
        62,
        56,
        128
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "playerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "makeMove",
      "discriminator": [
        78,
        77,
        152,
        203,
        222,
        211,
        208,
        233
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true,
          "relations": [
            "playerState"
          ]
        },
        {
          "name": "playerState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "direction",
          "type": {
            "defined": {
              "name": "pathDirection"
            }
          }
        }
      ]
    },
    {
      "name": "purchaseCiphers",
      "discriminator": [
        99,
        179,
        154,
        118,
        166,
        190,
        214,
        168
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "playerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameState",
      "discriminator": [
        144,
        94,
        208,
        172,
        248,
        99,
        134,
        120
      ]
    },
    {
      "name": "playerState",
      "discriminator": [
        56,
        3,
        60,
        86,
        174,
        16,
        244,
        195
      ]
    }
  ],
  "events": [
    {
      "name": "socialFeedEvent",
      "discriminator": [
        229,
        17,
        83,
        185,
        10,
        200,
        58,
        189
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientBalance",
      "msg": "Player has insufficient balance to pay for ciphers"
    },
    {
      "code": 6001,
      "name": "negativeCiphersAmount",
      "msg": "Player tries to purchase ciphers with a negative amount"
    },
    {
      "code": 6002,
      "name": "pathAlreadyCompleted",
      "msg": "Player has already completed the path"
    },
    {
      "code": 6003,
      "name": "unknownError",
      "msg": "Unknown Error"
    }
  ],
  "types": [
    {
      "name": "gameState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority"
            ],
            "type": "pubkey"
          },
          {
            "name": "prizePool",
            "docs": [
              "The current prize pool amount in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "pathLength",
            "docs": [
              "The length of the path players need to navigate"
            ],
            "type": "u8"
          },
          {
            "name": "gameEvents",
            "type": {
              "vec": {
                "defined": {
                  "name": "socialFeedEvent"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "pathDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "left"
          },
          {
            "name": "right"
          }
        ]
      }
    },
    {
      "name": "playerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "ciphers",
            "docs": [
              "Number of ciphers owned"
            ],
            "type": "u64"
          },
          {
            "name": "cards",
            "docs": [
              "Number of cards"
            ],
            "type": "u64"
          },
          {
            "name": "position",
            "docs": [
              "Current block number"
            ],
            "type": "u8"
          },
          {
            "name": "path",
            "type": {
              "vec": {
                "defined": {
                  "name": "pathDirection"
                }
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "Store bump to save compute"
            ],
            "type": "u8"
          },
          {
            "name": "playerEvents",
            "type": {
              "vec": {
                "defined": {
                  "name": "socialFeedEvent"
                }
              }
            }
          },
          {
            "name": "inGame",
            "docs": [
              "The player has joined the game or not"
            ],
            "type": "bool"
          },
          {
            "name": "firstLogin",
            "docs": [
              "Player's first login timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "lastLogin",
            "docs": [
              "Player's last login timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "gamesWon",
            "docs": [
              "Number of games the player has completed"
            ],
            "type": "u64"
          },
          {
            "name": "totalCiphersBought",
            "docs": [
              "Total number of ciphers the player has purchased"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "socialFeedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "eventType",
            "type": {
              "defined": {
                "name": "socialFeedEventType"
              }
            }
          },
          {
            "name": "message",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "socialFeedEventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "playerJoined"
          },
          {
            "name": "cardUsed"
          },
          {
            "name": "gameWon"
          },
          {
            "name": "ciphersPurchased"
          },
          {
            "name": "playerMoved"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "cipherCost",
      "type": "u64",
      "value": "1000000"
    },
    {
      "name": "discriminatorSize",
      "type": "u8",
      "value": "8"
    },
    {
      "name": "gameStateSeed",
      "type": "bytes",
      "value": "[103, 97, 109, 101, 95, 115, 116, 97, 116, 101]"
    },
    {
      "name": "initialPathLength",
      "type": "u8",
      "value": "20"
    },
    {
      "name": "initialPlayerCardsAmount",
      "type": "u64",
      "value": "1"
    },
    {
      "name": "initialPrizePool",
      "type": "u64",
      "value": "0"
    },
    {
      "name": "maxFeedEvents",
      "type": "u8",
      "value": "20"
    },
    {
      "name": "playerStateSeed",
      "type": "bytes",
      "value": "[112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101]"
    }
  ]
};
