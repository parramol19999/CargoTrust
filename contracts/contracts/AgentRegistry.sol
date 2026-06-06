// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    // Mapping of agent address to NFT token ID
    mapping(address => uint256) public agentToTokenId;

    // Mapping of token ID to agent metadata URI (agentURI)
    mapping(uint256 => string) private _agentURIs;

    // Mapping of token ID to the on-chain agent wallet address
    mapping(uint256 => address) public agentWallets;

    event AgentRegistered(uint256 indexed tokenId, address indexed agentWallet, string agentURI);

    constructor() ERC721("CargoTrust Trustless Agent Identity", "CTA") Ownable(msg.sender) {}

    function registerAgent(address agentWallet, string calldata _agentURI) external returns (uint256) {
        require(agentWallet != address(0), "Invalid agent address");
        require(agentToTokenId[agentWallet] == 0, "Agent already registered");

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        agentToTokenId[agentWallet] = tokenId;
        agentWallets[tokenId] = agentWallet;
        _agentURIs[tokenId] = _agentURI;

        emit AgentRegistered(tokenId, agentWallet, _agentURI);

        return tokenId;
    }

    function isRegisteredAgent(address agentWallet) external view returns (bool) {
        return agentToTokenId[agentWallet] != 0;
    }

    function agentURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC8004Metadata: URI query for nonexistent token");
        return _agentURIs[tokenId];
    }
}
