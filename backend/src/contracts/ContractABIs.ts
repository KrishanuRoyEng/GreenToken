/**
 * Contract ABIs for GreenToken Smart Contracts
 * These are the compiled interfaces for interacting with deployed contracts
 */

// BlueCarbonCredit (ERC20) ABI - Key functions only
export const BLUE_CARBON_CREDIT_ABI = [
    // Read functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function creditMetadata(uint256 tokenId) view returns (uint256 projectId, string location, uint256 areaHectares, string ecosystemType, uint256 timestamp, string ipfsHash, bool verified)",

    // Write functions
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function mintCredit(address to, uint256 amount, uint256 projectId, string location, uint256 areaHectares, string ecosystemType, string ipfsHash) returns (uint256)",
    "function verifyCredit(uint256 tokenId)",
    "function retireCredit(uint256 tokenId, uint256 amount)",
    "function burn(uint256 amount)",

    // Role functions
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event CreditMinted(uint256 indexed tokenId, uint256 indexed projectId, address indexed to, uint256 amount)",
    "event CreditRetired(uint256 indexed tokenId, address indexed by)",
    "event CreditVerified(uint256 indexed tokenId, address indexed verifier)"
] as const;

// ProjectRegistry ABI
export const PROJECT_REGISTRY_ABI = [
    // Read functions
    "function projects(uint256 projectId) view returns (uint256 id, address owner, string name, string location, int256 latitude, int256 longitude, uint256 areaHectares, uint8 ecosystemType, uint8 status, string ipfsMetadata, uint256 createdAt, uint256 approvedAt, address approvedBy, uint256 estimatedCredits, uint256 issuedCredits)",
    "function userProjects(address user, uint256 index) view returns (uint256)",
    "function getUserProjects(address user) view returns (uint256[])",
    "function carbonCreditToken() view returns (address)",

    // Write functions
    "function submitProject(string name, string location, int256 latitude, int256 longitude, uint256 areaHectares, uint8 ecosystemType, string ipfsMetadata) returns (uint256)",
    "function approveProject(uint256 projectId)",
    "function rejectProject(uint256 projectId)",
    "function issueCredits(uint256 projectId, uint256 amount)",

    // Role functions
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",

    // Events
    "event ProjectSubmitted(uint256 indexed projectId, address indexed owner)",
    "event ProjectApproved(uint256 indexed projectId, address indexed approver)",
    "event ProjectRejected(uint256 indexed projectId, address indexed rejector)",
    "event CreditsIssued(uint256 indexed projectId, uint256 amount)"
] as const;

// SoulboundToken (ERC721) ABI
export const SOULBOUND_TOKEN_ABI = [
    // Read functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function achievements(uint256 tokenId) view returns (string title, string description, uint256 projectId, string ipfsMetadata, uint256 timestamp)",

    // Write functions
    "function mintAchievement(address to, string title, string description, uint256 projectId, string ipfsMetadata) returns (uint256)",

    // Role functions
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",

    // Events
    "event AchievementMinted(uint256 indexed tokenId, address indexed to, uint256 indexed projectId)"
] as const;

// Role constants (keccak256 hashes)
export const ROLES = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    PAUSER_ROLE: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a',
    VERIFIER_ROLE: '0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2a8c6c1d6b9f3',
    ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775'
} as const;

// Ecosystem type enum mapping
export const ECOSYSTEM_TYPES = {
    Mangrove: 0,
    Seagrass: 1,
    SaltMarsh: 2,
    Kelp: 3
} as const;

// Project status enum mapping
export const PROJECT_STATUS = {
    Pending: 0,
    Approved: 1,
    Rejected: 2,
    Active: 3,
    Completed: 4
} as const;

export type EcosystemType = keyof typeof ECOSYSTEM_TYPES;
export type ProjectStatus = keyof typeof PROJECT_STATUS;
