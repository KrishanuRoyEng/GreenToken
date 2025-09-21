// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SoulboundToken is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Achievement {
        string title;
        string description;
        uint256 projectId;
        string ipfsMetadata;
        uint256 timestamp;
    }

    mapping(uint256 => Achievement) public achievements;
    uint256 private _nextTokenId = 1;

    event AchievementMinted(uint256 indexed tokenId, address indexed to, uint256 indexed projectId);

    constructor() ERC721("Blue Carbon Achievement", "BCA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintAchievement(
        address to,
        string memory title,
        string memory description,
        uint256 projectId,
        string memory ipfsMetadata
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        achievements[tokenId] = Achievement({
            title: title,
            description: description,
            projectId: projectId,
            ipfsMetadata: ipfsMetadata,
            timestamp: block.timestamp
        });

        _safeMint(to, tokenId);
        emit AchievementMinted(tokenId, to, projectId);
        return tokenId;
    }

    // Override transfer functions to make tokens soulbound
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override
    {
        require(from == address(0) || to == address(0), "Soulbound tokens cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}