import { BankrunProvider } from "anchor-bankrun";
import { Votingapp } from "../target/types/votingapp";
import { startAnchor } from "solana-bankrun";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { execPath } from "process";

const IDL = require("../target/idl/votingapp.json");

const votingAddress = new PublicKey(
  "J6K26zcbpAqJG5yQwJMSVp9n4sMV34vSXxwVQUc36ZvM"
);

describe("votingapp", () => {
  let context;
  let provider;
  let votingProgram: Program<Votingapp>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "votingapp", programId: votingAddress }],
      []
    );
    provider = new BankrunProvider(context);
    votingProgram = new Program<Votingapp>(IDL, provider);
  });

  it("Initialize Poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        "What is your favorite color?",
        new anchor.BN(0),
        new anchor.BN(1833645957)
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    //Testing
    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favorite color?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("Initialize Candidate", async () => {
    await votingProgram.methods
      .initializeCandidate("Red", new anchor.BN(1))
      .rpc();
    await votingProgram.methods
      .initializeCandidate("Green", new anchor.BN(1))
      .rpc();

    const [redAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Red")],
      votingAddress
    );

    const redCandidate = await votingProgram.account.candidate.fetch(
      redAddress
    );
    console.log(redCandidate);

    const [greenAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Green")],
      votingAddress
    );

    const greenCandidate = await votingProgram.account.candidate.fetch(
      greenAddress
    );
    console.log(greenCandidate);

    expect(redCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(greenCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("Vote", async () => {
    await votingProgram.methods.vote("Green", new anchor.BN(1)).rpc();

    const [greenAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Green")],
      votingAddress
    );

    const greenCandidate = await votingProgram.account.candidate.fetch(
      greenAddress
    );
    console.log(greenCandidate);
    expect(greenCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
