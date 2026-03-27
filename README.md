# GrantFlow: ZK-Verified Quadratic Grant Distribution

Sybil-resistant treasury grants via zero-knowledge proofs. No KYC, full privacy.

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment (Sepolia)

```bash
cp .env.example .env
# Fill SEPOLIA_RPC, PRIVATE_KEY, CIRCUIT_DIR
npx hardhat run scripts/deploy.js --network sepolia
```

## Run Dashboard

```bash
npx hardhat node
# Open public/dashboard.html in browser
```

## RPC URLs

- Sepolia: `https://ethereum-sepolia-rpc.publicnode.com`
- Hardhat Local: `http://127.0.0.1:8545`

## Circuit Compilation

```bash
cd circuits
snarkjs powersoftau new bls12_381 pot12.txt -n 15
snarkjs powersoftau prepare phase2 pot12.txt pot12_final.txt
snarkjs groth16 setup proof.circom pot12_final.txt circuit_0000.zkey
snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json
snarkjs groth16 prove circuit_0000.zkey input.json proof.json
snarkjs groth16 verify verification_key.json input.json proof.json
```

## Contract Addresses (After Deployment)

- ZKVerifier: Deployed address from `scripts/deploy.js`
- Vault: Deployed address from `scripts/deploy.js`

## Architecture

- **ZKVerifier.sol**: Groth16 proof verification on-chain
- **Circuit**: Merkle proof of SBT/NFT ownership without revealing identity
- **Vault**: ERC4626 compliant treasury with yield generation
- **Dashboard**: Real-time voting and treasury monitoring

## Security

- No KYC required - privacy-preserving identity proofs
- Sybil resistance via unique identity verification
- Treasury raids prevented by quadratic voting threshold