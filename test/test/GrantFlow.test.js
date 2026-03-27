const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GrantFlow Integration Tests", function () {
  let grantFlow, zkVerifier, vault, sbtToken;
  let owner, voter1, voter2, recipient, attacker;

  beforeEach(async function () {
    [owner, voter1, voter2, recipient, attacker] = await ethers.getSigners();

    // Deploy ZK Verifier
    const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
    zkVerifier = await ZKVerifier.deploy();
    await zkVerifier.waitForDeployment();

    // Deploy ERC4626 Vault
    const Vault = await ethers.getContractFactory("ERC4626Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    // Deploy SBT Token
    const SBT = await ethers.getContractFactory("SoulboundToken");
    sbtToken = await SBT.deploy();
    await sbtToken.waitForDeployment();

    // Deploy GrantFlow
    const GrantFlow = await ethers.getContractFactory("GrantFlow");
    grantFlow = await GrantFlow.deploy(
      zkVerifier.getAddress(),
      vault.getAddress(),
      sbtToken.getAddress()
    );
    await grantFlow.waitForDeployment();

    // Setup vault with owner
    await vault.setGrantFlow(grantFlow.getAddress());
    await vault.setOwner(owner.address);

    // Fund vault with 10 ETH
    await owner.sendTransaction({
      to: vault.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await zkVerifier.getAddress()).to.not.be.undefined;
      expect(await vault.getAddress()).to.not.be.undefined;
      expect(await sbtToken.getAddress()).to.not.be.undefined;
      expect(await grantFlow.getAddress()).to.not.be.undefined;
    });

    it("Should set correct addresses in GrantFlow", async function () {
      expect(await grantFlow.zkVerifier()).to.equal(zkVerifier.getAddress());
      expect(await grantFlow.vault()).to.equal(vault.getAddress());
      expect(await grantFlow.sbtToken()).to.equal(sbtToken.getAddress());
    });

    it("Should initialize with zero treasury", async function () {
      const treasury = await grantFlow.treasury();
      expect(treasury).to.equal(0);
    });
  });

  describe("SBT Minting", function () {
    it("Should mint SBT to voter1", async function () {
      await sbtToken.mint(voter1.address, 1);
      const balance = await sbtToken.balanceOf(voter1.address);
      expect(balance).to.equal(1);
    });

    it("Should mint SBT to voter2", async function () {
      await sbtToken.mint(voter2.address, 1);
      const balance = await sbtToken.balanceOf(voter2.address);
      expect(balance).to.equal(1);
    });

    it("Should not allow minting to zero address", async function () {
      await expect(
        sbtToken.mint(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("ERC721: mint to the zero address");
    });

    it("Should track unique voters", async function () {
      await sbtToken.mint(voter1.address, 1);
      const isVoter = await grantFlow.isVoter(voter1.address);
      expect(isVoter).to.be.true;
    });
  });

  describe("Voting Flow", function () {
    beforeEach(async function () {
      await sbtToken.mint(voter1.address, 1);
      await sbtToken.mint(voter2.address, 1);
    });

    it("Should create proposal", async function () {
      const proposalId = await grantFlow.createProposal(
        recipient.address,
        ethers.parseEther("1"),
        "Test Grant"
      );
      const proposal = await grantFlow.proposals(proposalId);
      expect(proposal.recipient).to.equal(recipient.address);
      expect(proposal.amount).to.equal(ethers.parseEther("1"));
      expect(proposal.status).to.equal(0); // Active
    });

    it("Should reject vote without SBT", async function () {
      await expect(
        grantFlow.vote(attacker.address, 1, [0], 0)
      ).to.be.revertedWith("GrantFlow: not eligible voter");
    });

    it("Should allow vote with SBT", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      const votes = await grantFlow.getVotes(1);
      expect(votes).to.be.greaterThan(0);
    });

    it("Should prevent double voting", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      await expect(
        grantFlow.vote(voter1.address, 1, [0], 0)
      ).to.be.revertedWith("GrantFlow: already voted");
    });

    it("Should track voting weight per voter", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      const weight = await grantFlow.getVotingWeight(voter1.address, 1);
      expect(weight).to.be.greaterThan(0);
    });
  });

  describe("ZK Proof Verification", function () {
    beforeEach(async function () {
      await sbtToken.mint(voter1.address, 1);
      await grantFlow.createProposal(recipient.address, ethers.parseEther("1"), "Test");
    });

    it("Should verify valid proof", async function () {
      const proof = await grantFlow.generateProof(voter1.address, 1);
      const valid = await zkVerifier.verifyProof(proof.proof, proof.inputs);
      expect(valid).to.be.true;
    });

    it("Should reject invalid proof", async function () {
      const invalidProof = {
        a: [1, 2],
        b: [[3, 4], [5, 6]],
        c: [7, 8],
      };
      const valid = await zkVerifier.verifyProof(invalidProof, [0]);
      expect(valid).to.be.false;
    });

    it("Should reject proof with zero values", async function () {
      const zeroProof = {
        a: [0, 0],
        b: [[0, 0], [0, 0]],
        c: [0, 0],
      };
      await expect(
        zkVerifier.verifyProof(zeroProof, [0])
      ).to.be.revertedWith("ZKVerifier: invalid proof");
    });
  });

  describe("Fund Release", function () {
    beforeEach(async function () {
      await sbtToken.mint(voter1.address, 1);
      await sbtToken.mint(voter2.address, 1);
      await grantFlow.createProposal(recipient.address, ethers.parseEther("5"), "Test");
    });

    it("Should release funds after threshold", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      await grantFlow.vote(voter2.address, 1, [0], 0);

      const tx = await grantFlow.releaseFunds(1);
      const receipt = await tx.wait();

      const proposal = await grantFlow.proposals(1);
      expect(proposal.status).to.equal(1); // Released

      const recipientBalance = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalance).to.be.greaterThan(0);
    });

    it("Should not release funds without threshold", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      await expect(grantFlow.releaseFunds(1)).to.be.revertedWith(
        "GrantFlow: insufficient votes"
      );
    });

    it("Should not release already released funds", async function () {
      await grantFlow.vote(voter1.address, 1, [0], 0);
      await grantFlow.vote(voter2.address, 1, [0], 0);
      await grantFlow.releaseFunds(1);

      await expect(grantFlow.releaseFunds(1)).to.be.revertedWith(
        "GrantFlow: already released"
      );
    });

    it("Should track treasury balance correctly", async function () {
      const initialBalance = await grantFlow.treasury();
      await grantFlow.vote(voter1.address, 1, [0], 0);
      await grantFlow.vote(voter2.address, 1, [0], 0);
      await grantFlow.releaseFunds(1);

      const finalBalance = await grantFlow.treasury();
      expect(finalBalance).to.be.lessThan(initialBalance);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle proposal with zero amount", async function () {
      await expect(
        grantFlow.createProposal(recipient.address, 0, "Zero Grant")
      ).to.be.revertedWith("GrantFlow: invalid amount");
    });

    it("Should handle non-existent proposal", async function () {
      await expect(grantFlow.releaseFunds(999)).to.be.revertedWith(
        "GrantFlow: proposal not found"
      );
    });

    it("Should prevent owner from releasing without votes", async function () {
      await expect(grantFlow.releaseFunds(1)).to.be.revertedWith(
        "GrantFlow: insufficient votes"
      );
    });

    it("Should track total treasury", async function () {
      const treasury = await grantFlow.treasury();
      expect(treasury).to.be.greaterThan(0);
    });
  });

  describe("Full Integration Flow", function () {
    it("Should complete entire grant flow", async function () {
      // 1. Mint SBTs
      await sbtToken.mint(voter1.address, 1);
      await sbtToken.mint(voter2.address, 1);

      // 2. Create proposal
      const proposalId = await grantFlow.createProposal(
        recipient.address,
        ethers.parseEther("3"),
        "Full Flow Grant"
      );

      // 3. Vote with ZK proof
      await grantFlow.vote(voter1.address, proposalId, [0], 0);
      await grantFlow.vote(voter2.address, proposalId, [0], 0);

      // 4. Verify proof
      const proof = await grantFlow.generateProof(voter1.address, proposalId);
      const valid = await zkVerifier.verifyProof(proof.proof, proof.inputs);
      expect(valid).to.be.true;

      // 5. Release funds
      await grantFlow.releaseFunds(proposalId);

      // 6. Verify final state
      const proposal = await grantFlow.proposals(proposalId);
      expect(proposal.status).to.equal(1);

      const recipientBalance = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalance).to.be.greaterThan(0);
    });
  });
});