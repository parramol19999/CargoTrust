// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ICargoRegistry {
    function purchaseCargo(uint256 tokenId) external;
}

contract MaliciousERC20 is ERC20 {
    address public targetRegistry;
    bool public shouldReenter;
    uint256 public targetTokenId;

    constructor() ERC20("Malicious USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**6);
    }

    function setReentrancyAttack(address _registry, uint256 _tokenId, bool _enable) external {
        targetRegistry = _registry;
        targetTokenId = _tokenId;
        shouldReenter = _enable;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool success = super.transferFrom(from, to, amount);
        
        if (shouldReenter) {
            shouldReenter = false; // Prevent infinite loop
            ICargoRegistry(targetRegistry).purchaseCargo(targetTokenId);
        }
        
        return success;
    }
}
