# Blockrunners Game

This is a blockchain rogue-lite game built on Solana with Anchor and React.

Play the game here: [https://blockrunners-game.com](https://blockrunners-game.com)

Scroll down for [instructions](#prerequisites) on how to run the game locally and how to deploy it to devnet/mainnet.

## Game Story

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

## Prerequisites

Follow the installation here: https://www.anchor-lang.com/docs/installation

That should install:

- Rust
- Solana CLI
- Anchor CLI
- Node.js
- Yarn


## Running Tests

```bash
# Run the test suite with test feature
anchor test -- --features test
```

## Local deployment

The program includes a `test` feature that makes local development easier by mocking the Switchboard randomness. This means that all moves are always successful and you get a "Doubler" card after every move instead of a random card.

```bash
# Set Solana CLI to use localhost
solana config set --url localhost

# Build with test feature enabled
anchor build -- --features test

# Update the program ID in Anchor.toml if needed
anchor keys sync

# Start Solana test validator (in a separate terminal or background)
solana-test-validator --reset

# Deploy to localnet
anchor deploy

# Copy the IDL to the frontend
anchor run copy_idl

# Install frontend dependencies
cd app
yarn install
cd ..

# Start the frontend
anchor run frontend
```

Your game should now be running at localhost connected to your deployed program on localnet running with alocal Solana validator.

### Production Deployment

For devnet/mainnet deployment:

```bash
# Set cluster
solana config set --url devnet  # or mainnet-beta

# Build (without the `test` feature)
anchor build

# Update the program ID in Anchor.toml if needed
anchor keys sync

# Deploy
anchor deploy

# Copy IDL for the frontend
anchor run copy_idl

# Start the frontend
anchor run frontend_devnet  # or frontend_mainnet

# Publish the IDL
anchor idl init <programId> -f <target/idl/program.json>

# Upgrade the IDL
anchor idl upgrade <programId> -f <target/idl/program.json>
```
