
Using **smart contract** built using the **Anchor Framework** for **Solana Blockchain**. The program implements a simple voting application with basic functionality. It allows users to : 
- **Initialize Polls** with metadata like description, start time, and end time
- **Add candidates** to polls
- **Vote** for candidates in a spesific polls

### `lib.rs`
#### 1. Code Declaration
```
#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;
```

- `#![allow(clippy::result_large_err)]` Disables warnings related to large error type in `Result`
- `use anchor_lang::prelude::*;` Imports necessary modules from the Anchor Framework to simplfy program development

#### 2. Program Identifier
```
declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

```
- `declare_id!`: Defines the unique program ID for this smart contract, which is required for Solana programs to identify the code on the blockchain

---
### Core Program Logic
#### 1. Initialize Polls

```
pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, description: String, poll_start: u64, poll_end: u64) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    poll.poll_id = poll_id;
    poll.description = description;
    poll.poll_start = poll_start;
    poll.poll_end = poll_end;
    poll.candidate_amount = 0;
    Ok(())
}
```
- **Purpose** : Creates a new poll with metadata (ID, description, start and end times)
- **Accounts Used** : 
	- `poll`: The poll accounts is initialized and populated with the provided data
	- `signer`: Pays for account creation
- Fields
	- `poll_id`: Unique identifier for the poll.
	- `description`: Description of the poll (max length: 32).
	- `poll_start`: Timestamp for poll start.
	- `poll_end`: Timestamp for poll end.
	- `candidate_amount`: Counter for the number of candidates added.

#### 2. Initialize Candidate
```
pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, _poll_id: u64) -> Result<()> {
    let candidate = &mut ctx.accounts.candidate;
    let poll = &mut ctx.accounts.poll;
    poll.candidate_amount += 1;
    candidate.candidate_name = candidate_name;
    candidate.candidate_votes = 0;
    Ok(())
}
```
- **Purpose** : Adds a new candidate to an existing poll
- **Account Used**: 
	- `candidate`: Stores candidate data (name, vote count)
	- `poll`: Updates the candidate counter
	- `signer`: Pays for account creation
- **Fields** : 
	- `candidate_name`: Name of the candidate (max length:32)
	- `candidate_votes` : Initialize vote count to 0

#### 3. Vote
```
pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
    let candidate = &mut ctx.accounts.candidate;
    candidate.candidate_votes += 1;
    msg!("Voted for candidate: {}", candidate.candidate_name);
    msg!("Votes: {}", candidate.candidate_votes); //Simple Logging
    Ok(())
}
```
- **Purpose**: Casts a vote for a spesific candidate in a poll
- **Account Used**:
	- `candidate`: Increments the vote count
	- `poll`: Verifies the poll
	- `signer`: The voter

---
### Account Definitions
#### 1. Poll
```
#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(32)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}
```
- Represents a poll on the blockchain
- **Fields** : 
	- `poll_id`: Unique poll identifier.
	- `description`: Poll description (max length: 32).
	- `poll_start` / `poll_end`: Start and end timestamps for the poll.
	- `candidate_amount`: Tracks the number of candidates in the poll.

#### 2. Candidate
```
#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}
```
- Represents a candidate in a poll
- **Fields**: 
	- `candidate_name`: Name of the candidate
	- `candidate_votes`: Total number of votes for the candidate

---

### Account Definitions
#### 1. InitializePoll
```
#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}
```
- **Purpose**: Validates and initializes a poll.
- **Attributes**:
    - `seeds`: Derives a unique address for the poll using `poll_id`.
    - `payer`: Specifies the signer as the payer for account creation.

#### 2. InitializeCandidate
```
#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = signer,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    pub system_program: Program<'info, System>,
}
```
- **Purpose**: Validates and initializes a candidate.
- **Attributes**:
    - `seeds`: Derives a unique address for the candidate using `poll_id` and `candidate_name`.

#### 3. Vote
```
#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,
    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
}
```
- **Purpose**: Validates accounts for voting.
- **Attributes**:
    - `seeds`: Ensures the candidate belongs to the specified poll.