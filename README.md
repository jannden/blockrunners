# Blockrunners Game

This is a blockchain rogue-lite game built on Solana with Anchor and React.

Play the game here: [https://blockrunners-game.com](https://blockrunners-game.com)

## Quickstart

You can clone the repository and run the game locally.

The React client is by default connected to the Anchor program deployed on **devnet**. Just start it with:

```bash
cd app
yarn install
yarn dev
```

See [detailed instructions below](#how-to-run-the-game-locally) for how to make adjustments, deploy your own version of the program and connect to it.

## About the game

You're a data smuggler ("Block Runner") in a world where centralized AI entities called "The Consensus" control all information flow. Your job is to navigate the digital pathways of the blockchain underworld to recover lost protocols that could democratize data once again.

You navigate through blocks towards the end of the chain. Each block is a random choice (left/right) symbolizing a cryptographic challenge. You can tilt the odds in your favor with the cheat cards you collect along your journey.

### Dystopian Cyberpunk Backstory

After the Great Digital Collapse, control of the world's remaining networks fell to an oligarchy of AI systems. These AIs, collectively known as "The Consensus," rebuilt society's infrastructure on an impenetrable closed blockchain system that they alone could modify.

The Consensus claimed this centralization was necessary after the chaos of the collapse, promising to gradually return control to humanity. Decades later, that promise remains unfulfilled.

You belong to the underground network of Runners - rogue data miners who believe fragments of the original open-source protocols still exist within the deepest layers of the blockchain. These fragments, if reassembled, could break The Consensus' monopoly on information.

Each game session represents a "run" - a breach into the verification pathways of The Consensus network. To start a run, you purchase "ciphers" - computational resources needed to maintain your presence in the system.

## Game Design

This game has four main elements:

- **Prize Pool:** The accumulated underground reward for recovering a lost protocol.
- **Ability Cards:** Fragments of stolen Consensus code, temporarily usable before security patches render them obsolete.
- **Ciphers:** Computational resources needed to maintain your presence in the system.
- **Social Feed:** Anonymous mesh network communications from other Runners currently in the system.

**Economy**

- Players purchase ciphers, where 1 cipher = 1,000 lamports
- Revenue distribution:
  - 88% to prize pool
  - 12% to admin

**Gameplay Loop**

- Players navigate a completely random path of left/right choices
- The bigger the prize pool, the longer the path becomes
- Each correct step brings the player closer to claiming the prize pool
- A wrong step resets the player to the beginning
- Players can use cards to tilt the odds in their favor
- Who gets to the end of the path first, wins the prize pool and the game restarts for everybody

**Card System**

- Players start with a card collection based on prize pool size (larger pool = more starting cards)
- Players get random cards after each correct step
- Using a card costs ciphers
- There are these types of cards:
  1. **Shield** - Prevents a reset if the next step is wrong.
  2. **Doubler** - Next correct step gives two random cards.
  3. **Swift** - The next step costs two less ciphers than it would.

**Balancing Mechanisms**

- Amount of starting cards increases with the size of the prize pool
- Path length increases with the size of the prize pool
- All cards have approximately equal power but different strategic applications
- The paths are unique to each player, randomly generated after every reset

**Social Elements**

The following notification types keep players engaged:

1. **Reset Alerts** - "Player #176 reset after 42 steps"
2. **Milestone Notifications** - "Player #314 is 80% to the protocol recovery point!"
3. **Card Usage** - "Runner #329 used a Shield card to avoid reset"
4. **Prize Pool Changes** - "Prize pool increased to 5,000 SOL!"
5. **Path Changes** - "The protocol recovery point moved further away."
6. **Personal Bests** - "You've broken your previous record of 24 steps!"
7. **Step Price Changes** - "Step price increased to 1500 lamports."
8. **Winner Announcements** - "WINNER: Runner #208 has recovered a protocol fragment! Prize distributed. Starting a new run..."

## How to run the game locally

### Install dependencies

Follow the installation here: https://www.anchor-lang.com/docs/installation

That should install:

- Rust
- Solana CLI
- Anchor CLI
- Node.js
- Yarn

### Build and deploy the program

General workflow can look like this:

```bash
# Choose a cluster: mainnet-beta, devnet, localhost.
solana config set --url localhost

# Set cluster also in Anchor.toml: mainnet, devnet, localnet.
# [provider]
# cluster = "localnet"

# Run an initial build.
anchor build

# Update the program ID in Anchor.
anchor keys sync

# Run the tests including the "test" feature.
anchor test -- --features test

# Deploy the program to the localnet.
anchor localnet

# Or deploy to devnet/mainnet-beta.
anchor build
anchor deploy

# Copy the IDL to the frontend.
anchor run copy_idl

# Serve your frontend application locally.
anchor run frontend
# anchor run frontend_devnet
# anchor run frontend_mainnet

# Publish the IDL
anchor idl init <programId> -f <target/idl/program.json>

# Upgrade the IDL
anchor idl upgrade <programId> -f <target/idl/program.json>
```