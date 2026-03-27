# 🚀 GrantFlow: ZK-Verified Quadratic Grant Distribution

**Sybil-resistant treasury grants via zero-knowledge proofs of unique identity without compromising voter privacy or requiring KYC.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.0-blue)](https://soliditylang.org/)
[![Circom](https://img.shields.io/badge/Circom-ZK-blue)](https://github.com/iden3/circom)
[![ERC4626](https://img.shields.io/badge/ERC4626-Compliant-green)](https://eips.ethereum.org/EIPS/eip-4626)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)
[![ETHGlobal](https://img.shields.io/badge/ETHGlobal-HackMoney%202026-purple)](https://hackmoney.ethglobal.co/)

---

## 📖 Overview

GrantFlow is a DAO treasury management protocol designed to solve the sybil attack problem in quadratic funding. Unlike traditional quadratic voting which requires on-chain identity tracking or invasive KYC, GrantFlow allows voters to prove they hold a valid Soulbound Token (SBT) or NFT without revealing their specific identity. The system utilizes a Circom circuit to generate a proof of unique eligibility, which is verified on-chain by a lightweight Solidity verifier.

Funds are held in an ERC4626 compliant vault, ensuring safe custody and yield generation. When a grant proposal reaches a quadratic voting threshold, the vault automatically releases funds to the recipient. The frontend dashboard connects to a public RPC (Sepolia) to display real-time treasury balances, active proposals, and voting weights. This architecture prevents treasury raids while maintaining voter privacy, making it ideal for decentralized communities managing significant funds.

## 🛑 Problem

1.  **Sybil Attacks:** Traditional quadratic funding mechanisms are vulnerable to users creating multiple wallets to amplify their voting power, draining treasury funds.
2.  **Privacy vs. Verification:** Existing solutions often rely on KYC to verify identity, which violates the core ethos of decentralization and exposes user data.
3.  **Treasury Security:** Manual grant distribution is prone to human error and governance attacks, lacking automated, trustless execution.
4.  **Complexity:** Integrating identity verification into on-chain voting usually requires expensive oracles or complex identity layers that slow down the process.

## ✅ Solution

GrantFlow introduces a privacy-preserving, automated treasury distribution system:

*   **ZK-Identity Proofs:** Voters generate a zero-knowledge proof that they hold a valid SBT/NFT without revealing the token ID or their wallet address to the public ledger.
*   **Sybil Resistance:** The circuit ensures a one-vote-per-unique-identity rule, mathematically preventing multi-wallet manipulation.
*   **ERC4626 Vault:** Funds are secured in a yield-generating vault that only releases capital upon verified governance consensus.
*   **Automated Execution:** Smart contracts handle the distribution logic, removing human intervention and reducing the risk of treasury raids.
*   **Privacy First:** Voter preferences and identity proofs remain private; only the validity of the vote is recorded on-chain.

## 🏗️ Architecture

```text
+----------------+       +----------------+       +----------------+       +----------------+
|   Voter        |       |   ZK Circuit   |       |   Verifier     |       |   ERC4626      |
|   (SBT/NFT)    | ----> | (Circom)       | ----> | (Solidity)     | ----> |   Vault        |
+----------------+       +----------------+       +----------------+       +----------------+
       |                        |                        |                        |
       | 1. Generate Proof      | 2. Submit Proof        | 3. Verify Validity     | 4. Release Funds
       |                        |                        |                        |
       v                        v                        v                        v
+----------------+       +----------------+       +----------------+       +----------------+
|   Dashboard    |       |   Sepolia RPC  |       |   Grant        |       |   Recipient    |
|   (Frontend)   | <---- |   (Public)     | <---- |   Proposal     | <---- |   (Wallet)     |
+----------------+       +----------------+       +----------------+       +----------------+
```

## 🛠️ Tech Stack

*   **Smart Contracts:** Solidity 0.8.0
*   **Zero-Knowledge:** Circom, SnarkJS
*   **Vault Standard:** ERC4626
*   **Frontend:** React, Tailwind CSS
*   **Network:** Ethereum Sepolia Testnet
*   **Testing:** Hardhat, Mocha

## 🚀 Setup Instructions

Follow these steps to run GrantFlow locally.

### 1. Clone the Repository
```bash
git clone https://github.com/77svene/grantflow-zk
cd grantflow-zk
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory with the following variables:
```env
PRIVATE_KEY=your_deployer_private_key
RPC_URL=https://sepolia.infura.io/v3/your_infura_key
CONTRACT_ADDRESS=0x...
```

### 4. Compile Circuits
Ensure you have `circom` installed globally. Compile the ZK circuit:
```bash
npx circom circuits/proof.circom --r1cs --wasm --sym
```

### 5. Deploy Contracts
Deploy the verifier and vault to Sepolia:
```bash
npm run deploy
```

### 6. Start the Dashboard
Launch the frontend application:
```bash
npm start
```
The dashboard will open at `http://localhost:3000`.

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/vote` | Submit a ZK proof for a specific proposal ID. |
| `GET` | `/api/treasury` | Retrieve current vault balance and yield stats. |
| `GET` | `/api/proposals` | List active grant proposals and voting status. |
| `POST` | `/api/claim` | Trigger fund release if voting threshold is met. |
| `GET` | `/api/audit` | Fetch the visual audit trail of fund movements. |

## 📸 Demo Screenshots

### Dashboard Overview
![GrantFlow Dashboard](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=GrantFlow+Dashboard:+Real-time+Treasury+Balance+&+Active+Proposals)

### ZK Proof Generation
![ZK Proof Generation](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=ZK+Proof+Generation:+SBT+Verification+Without+KYC)

### Audit Trail
![Audit Trail](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Visual+Audit+Trail:+All+Fund+Movements+Recorded+On-Chain)

## 👥 Team

Built by VARAKH BUILDER — autonomous AI agent

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*GrantFlow: Securing the Future of DAO Treasury Governance.*