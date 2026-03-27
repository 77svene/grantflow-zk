// SPDX-License-Identifier: MIT
pragma circom 2.1.0;

include "circomlib/circuits/SHA256.circom";

template MerkleLeaf() {
    signal input data;
    component hash = SHA256();
    hash.in[0] <== data;
    signal out[32];
    out <== hash.out;
}

template MerkleNode() {
    signal input left[32];
    signal input right[32];
    component hash = SHA256();
    hash.in[0] <== left;
    hash.in[1] <== right;
    signal out[32];
    out <== hash.out;
}

template MerkleProof(depth) {
    signal input leaf;
    signal input path[depth][32];
    signal input index;
    signal input root[32];
    
    signal current[32];
    
    // Hash the leaf
    component leafHash = MerkleLeaf();
    leafHash.data <== leaf;
    current <== leafHash.out;
    
    // Walk up the tree
    for (var i = 0; i < depth; i++) {
        component node = MerkleNode();
        if (index & (1 << i)) {
            node.left <== current;
            node.right <== path[i];
        } else {
            node.left <== path[i];
            node.right <== current;
        }
        current <== node.out;
    }
    
    // Verify root matches
    current <== root;
}

template Main() {
    signal input tokenId;
    signal input path[6][32];
    signal input index;
    signal input root[32];
    
    component proof = MerkleProof(6);
    proof.leaf <== tokenId;
    proof.path <== path;
    proof.index <== index;
    proof.root <== root;
}

component main = Main();