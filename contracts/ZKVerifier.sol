// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ZKVerifier {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    function verifyProof(Proof calldata _proof, uint256[2] calldata _inputs) public view returns (bool) {
        require(_proof.a[0] != 0, "ZKVerifier: invalid proof");
        require(_proof.a[1] != 0, "ZKVerifier: invalid proof");
        require(_proof.b[0][0] != 0, "ZKVerifier: invalid proof");
        require(_proof.b[0][1] != 0, "ZKVerifier: invalid proof");
        require(_proof.b[1][0] != 0, "ZKVerifier: invalid proof");
        require(_proof.b[1][1] != 0, "ZKVerifier: invalid proof");
        require(_proof.c[0] != 0, "ZKVerifier: invalid proof");
        require(_proof.c[1] != 0, "ZKVerifier: invalid proof");

        uint256[2] memory ab;
        uint256[2] memory cd;
        uint256[2] memory inputs;

        ab[0] = _pairing(_proof.a, _proof.b[0]);
        ab[1] = _pairing(_proof.a, _proof.b[1]);
        cd[0] = _pairing(_proof.c, _proof.b[0]);
        cd[1] = _pairing(_proof.c, _proof.b[1]);
        inputs[0] = _pairing(_inputs, _proof.b[0]);
        inputs[1] = _pairing(_inputs, _proof.b[1]);

        return _checkPairing(ab, cd, inputs);
    }

    function _pairing(uint256[2] memory a, uint256[2][2] memory b) internal view returns (uint256) {
        uint256[2] memory r;
        assembly {
            let success := staticcall(gas(), 8, a, 0x60, b, 0xc0, r, 0x40)
            if iszero(success) {
                revert(0, 0)
            }
        }
        return r[0];
    }

    function _checkPairing(uint256[2] memory ab, uint256[2] memory cd, uint256[2] memory inputs) internal view returns (bool) {
        uint256[2] memory result;
        assembly {
            let success := staticcall(gas(), 8, ab, 0x40, cd, 0x40, result, 0x40)
            if iszero(success) {
                revert(0, 0)
            }
            if iszero(eq(mload(result), 1)) {
                return(0, 0)
            }
        }
        return true;
    }
}