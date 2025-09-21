// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract BlueCarbonCredit is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct CreditMetadata {
        uint256 projectId;
        string location;
        uint256 areaHectares;
        string ecosystemType;
        uint256 timestamp;
        string ipfsHash;
        bool verified;
    }

    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(uint256 => bool) public retiredCredits;
    uint256 private _nextTokenId = 1;

    event CreditMinted(uint256 indexed tokenId, uint256 indexed projectId, address indexed to, uint256 amount);
    event CreditRetired(uint256 indexed tokenId, address indexed by);
    event CreditVerified(uint256 indexed tokenId, address indexed verifier);

    constructor() ERC20("Blue Carbon Credit", "BCC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function mintCredit(
        address to,
        uint256 amount,
        uint256 projectId,
        string memory location,
        uint256 areaHectares,
        string memory ecosystemType,
        string memory ipfsHash
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        creditMetadata[tokenId] = CreditMetadata({
            projectId: projectId,
            location: location,
            areaHectares: areaHectares,
            ecosystemType: ecosystemType,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            verified: false
        });

        _mint(to, amount);
        emit CreditMinted(tokenId, projectId, to, amount);
        return tokenId;
    }

    function verifyCredit(uint256 tokenId) public onlyRole(VERIFIER_ROLE) {
        require(tokenId < _nextTokenId, "Credit does not exist");
        creditMetadata[tokenId].verified = true;
        emit CreditVerified(tokenId, msg.sender);
    }

    function retireCredit(uint256 tokenId, uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(!retiredCredits[tokenId], "Credit already retired");
        
        _burn(msg.sender, amount);
        retiredCredits[tokenId] = true;
        emit CreditRetired(tokenId, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}