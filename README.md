# Blockrunners Game

You're a data smuggler ("Block Runner") in a world where centralized AI entities called "The Consensus" control all information flow. Your job is to navigate the digital pathways of the blockchain underworld to recover lost protocols that could democratize data once again.

You navigate through blocks towards the end of the chain. Each block is a random choice (left/right) symbolizing a cryptographic challenge. You can tilt the odds in your favor with the cheat cards you collect along your journey.

## Dystopian Cyberpunk Backstory

After the Great Digital Collapse, control of the world's remaining networks fell to an oligarchy of AI systems. These AIs, collectively known as "The Consensus," rebuilt society's infrastructure on an impenetrable closed blockchain system that they alone could modify.

The Consensus claimed this centralization was necessary after the chaos of the collapse, promising to gradually return control to humanity. Decades later, that promise remains unfulfilled.

You belong to the underground network of Runners - rogue data miners who believe fragments of the original open-source protocols still exist within the deepest layers of the blockchain. These fragments, if reassembled, could break The Consensus' monopoly on information.

Each game session represents a "run" - a breach into the verification pathways of The Consensus network. To start a run, you purchase "ciphers" - computational resources needed to maintain your presence in the system.

## Game Design

A rogue-lite game built on Solana with Anchor using VRF and presented with React using these elements:

- **Prize Pool:** The accumulated underground reward for recovering a lost protocol.
- **Cheat Cards:** Specialized subroutines stolen from Consensus code, temporarily usable before security patches render them obsolete.
- **Ciphers:** Computational resources needed to maintain your presence in the system, each move costs a cipher.
- **Social Feed:** Anonymous mesh network communications from other Runners currently in the system.

**Economy**

- Players purchase ciphers: eg. 1,000 lamports = 1 cipher
- Ciphers become more expensive the bigger the prize pool
- Revenue distribution:
  - 40% to prize pool
  - 30% to creators
  - 20% to oracles (randomness & AI)
  - 10% to future game pools (treasury)

**Gameplay Loop**

- Players navigate a completely random path of left/right choices
- The bigger the prize pool, the longer the path becomes
- Each correct step brings the player closer to recovering the lost protocol and claiming the prize pool
- A wrong step resets the player to the beginning, losing all collected cards
- Players start with a card collection based on prize pool size (larger pool = more starting cards)
- Once a player gets to the end of the path and recovers the lost protocol, they win the prize pool and the game restarts for everybody

**Card System**

- After each correct step, the player receives one random card from the following options:
  1. **Oracle** - Shows the correct path for the next step
  2. **Shield** - Prevents a reset if the next step is wrong
  3. **Doubler** - Next correct step gives two random cards instead of one
- Using a card costs ciphers

**Balancing Mechanisms**

- For every 10 steps in the prize path, players start with 1 random card
- Path length increases in relation to the size of the prize pool
- All cards have approximately equal power but different strategic applications
- The paths are unique to each player, randomly generated after every reset

**Social Elements**

The mesh network allows Runners to stay connected and motivated. The following notification types keep players engaged:

1. **Reset Alerts** - "Player #176 reset after 42 steps"
2. **Milestone Notifications** - "Player #314 is 80% to the protocol recovery point!"
3. **Card Usage** - "Runner #329 used a Shield card to avoid reset"
4. **Prize Pool Changes** - "Prize pool increased to 5,000 SOL!"
5. **Path Changes** - "The protocol recovery point moved further away."
6. **Personal Bests** - "You've broken your previous record of 24 steps!"
7. **Step Price Changes** - "Step price increased to 1500 lamports."
8. **Winner Announcements** - "WINNER: Runner #208 has recovered a protocol fragment! Prize distributed. Starting a new run..."

## Alpha Implementation

Alpha implementation is a simple game with:
- no frontend, using only tests to interact with the game deterministically
- pseudo random number generator instead of an VRF
- no revenue distribution, the whole collected amount goes to the prize pool
- fixed path length of 20 blocks
- only 1 card: "the oracle"
- simplified social feed:
  - when a new player joins
  - when someone wins the run
  - result of card usage
- social feed is obtained only on request

The game starts when the first player purchases ciphers to start a run. Other players can join the run by purchasing ciphers.

A pseudo-random path is generated for each player where each of the 20 blocks has a pre-determined correct choice (left or right).

Information is available about the players position (block number), length of the path, the prize pool, type and amount of cards collected, and amount of ciphers owned.

It's possible to buy more ciphers at any time.

The player starts at block 0 with one starting card.

When a player uses a card, one cipher is consumed and the player receives a message on the social feed.

When a player makes a move, one cipher is consumed and the game checks if the choice is correct:
- If correct, the player moves to the next block and receives a card.
- If incorrect, the player returns to block 0, loses all collected cards and is given one starting card.

The player who first gets to the end of the path wins the run and ends the game.

When the game ends:
- the prize pool is distributed to the winner
- the game state is reset:
  - cleaning ciphers,
  - cleaning the paths,
  - cleaning the cards.

### Task 1: Project Initialization & Core Program Structure
**Description:** Set up the Anchor project structure for the Blockrunners game and define the core game state.
- Initialize Anchor project structure
- Create base program structure with necessary Anchor imports
- Define the GameState struct to track prize pool, path length, and game status
- Create basic initialization instruction

**Definition of Done:**
- Anchor project builds without errors
- Program compiles successfully
- Initial test confirms program can be deployed and initialized

**Tests:**
- Test program initialization with correct game parameters
- Verify initial game state values are set correctly

### Task 2: Player Management
**Description:** Implement the player account structure and joining mechanism.
- Create PlayerState struct to track player position, ciphers, cards
- Implement the join_game instruction for players to enter the game
- Not part of this task:
   - ciphers,
   - cards,
   - moves,
   - social feed.

**Definition of Done:**
- Players can join the game

**Tests:**
- Test player account creation and initialization
- Verify player state updates correctly after joining

### Task 3: Path Generation
**Description:** Create the pseudo-random path generation system.
- Implement a deterministic pseudo-random number generator
- Create path generation for a fixed 20-block length
- Build account structure to store each player's unique path
- Ensure paths are generated on player join

**Definition of Done:**
- Deterministic paths are generated for each player
- Paths are 20 blocks long with left/right choices
- Paths are unique per player and stored on-chain

**Tests:**
- Test path generation determinism
- Verify unique paths for different players
- Confirm path length is 20 blocks

### Task 4: Player Movement
**Description:** Implement the basic movement mechanism.
- Create make_move instruction (left/right choice)
- Build logic to check if move is correct against player's path
- Implement block progression for correct moves
- Create reset mechanism for incorrect moves

**Definition of Done:**
- Players can make left/right moves
- Correct moves advance player position
- Incorrect moves reset player to start

**Tests:**
- Test successful player movement with correct choice
- Test player reset with incorrect choice

### Task 5: Card System
**Description:** Implement the basic card system with the Oracle card.
- Define card types enum (only Oracle for alpha)
- Implement card collection on successful moves
- Create starting card allocation (1 card at game start)
- Build card storage in player account

**Definition of Done:**
- Players receive Oracle cards on successful moves
- Players start with one Oracle card
- Cards are persisted in player account
- Card count is accurately tracked

**Tests:**
- Test card allocation on successful move
- Verify starting card allocation
- Test card persistence after game actions
- Verify card reset on player failure

### Task 6: Card Usage
**Description:** Implement the Oracle card usage functionality.
- Create use_card instruction
- Implement Oracle card effect (reveal correct path for next block)
- Build cipher consumption for card usage
- Ignore social feed notification for card usage (part of another task)

**Definition of Done:**
- Players can use Oracle cards
- Using a card consumes one cipher
- Oracle card reveals correct next move

**Tests:**
- Test Oracle card usage mechanics
- Verify cipher consumption on card use
- Test card usage information is correct
- Verify social feed records card usage

### Task 7: Game Economics
**Description:** Implement the prize pool and ciphers.
- Build prize pool account structure
- Implement cipher purchase with contribution to prize pool
- Create prize pool accumulation logic
- Implement prize distribution mechanism
- Implement cipher consumption on move and card usage

**Definition of Done:**
- Prize pool accumulates SOL from cipher purchases
- Prize pool amount is visible in game state
- Prize distribution works when game ends
- Cipher consumption on move and card usage

**Tests:**
- Test prize pool accumulation from multiple players
- Verify SOL transfers to prize pool
- Test prize distribution to winner

### Task 8: Game Completion
**Description:** Implement end-game mechanics.
- Create win condition check (reaching block 20)
- Implement game end procedure
- Build prize distribution to winner
- Create game state reset for new runs
- Implement winner notification in social feed

**Definition of Done:**
- Game correctly identifies when a player reaches the end
- Prize is distributed to winner
- Game state resets for a new run
- Social feed announces the winner

**Tests:**
- Test game completion when player reaches end
- Verify prize distribution to winner
- Test game reset functionality
- Verify game state after reset

### Task 9: Social Feed System
**Description:** Implement the simplified social feed.
- Create social feed account structure
- Implement message creation for the three required events:
  - New player joins
  - Card usage (tells the player result of the "Oracle" card)
  - Game win
- Build message storage and retrieval

**Definition of Done:**
- Social feed records the three required event types
- Messages are stored with timestamps
- Recent messages can be retrieved

**Tests:**
- Test social feed recording for each event type
- Verify message storage and format
- Test message retrieval

### Task 10: Game Information Access
**Description:** Create instructions to retrieve game state information.
- Implement get_game_state instruction
- Create get_player_state instruction
- Build get_social_feed instruction

**Definition of Done:**
- Game state information is accessible
- Player state information is accessible
- Social feed can be retrieved

**Tests:**
- Test retrieval of game state information
- Verify player state information access
- Test social feed retrieval

### Task 11: Error Handling & Security
**Description:** Implement robust error handling and security measures for the program.
- Add comprehensive input validation for all instructions
- Implement proper authorization checks for accounts
- Add error handling for common edge cases:
  - Game not initialized
  - Player already exists
  - Insufficient ciphers for move/card usage
  - Invalid move direction
  - Game already completed
- Implement security measures against potential exploits
- Add program constraints to prevent unauthorized state modifications

**Definition of Done:**
- All instructions properly validate inputs
- Authorization checks prevent unauthorized actions
- Edge cases are handled gracefully with clear error messages
- Basic security auditing complete

**Tests:**
- Test all error conditions and edge cases
- Verify authorization checks block unauthorized access
- Test input validation with invalid data
- Verify program constraints correctly enforce game rules

### Task 12: Integration Testing
**Description:** Create comprehensive integration tests simulating full gameplay.
- Build test script simulating multiple players joining
- Create test for full game loop with player interactions
- Implement test for game reset and new run
- Test prize distribution and verification

**Definition of Done:**
- Full game simulation tests pass
- Multiple player scenarios are tested
- Game reset and new runs work correctly
- Prize distribution is verified

**Tests:**
- Test full game loop with multiple players
- Verify correct game state transitions
- Test game reset and new run initialization
- Verify proper program behavior in complete gameplay scenario
