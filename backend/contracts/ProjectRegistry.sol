// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BlueCarbonCredits.sol";

contract ProjectRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum ProjectStatus { Pending, Approved, Rejected, Active, Completed }
    enum EcosystemType { Mangrove, Seagrass, SaltMarsh, Kelp }

    struct Project {
        uint256 id;
        address owner;
        string name;
        string location;
        int256 latitude;
        int256 longitude;
        uint256 areaHectares;
        EcosystemType ecosystemType;
        ProjectStatus status;
        string ipfsMetadata;
        uint256 createdAt;
        uint256 approvedAt;
        address approvedBy;
        uint256 estimatedCredits;
        uint256 issuedCredits;
    }

    BlueCarbonCredit public carbonCreditToken;
    
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public userProjects;
    uint256 private _nextProjectId = 1;

    event ProjectSubmitted(uint256 indexed projectId, address indexed owner);
    event ProjectApproved(uint256 indexed projectId, address indexed approver);
    event ProjectRejected(uint256 indexed projectId, address indexed rejector);
    event CreditsIssued(uint256 indexed projectId, uint256 amount);

    constructor(address _carbonCreditToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        carbonCreditToken = BlueCarbonCredit(_carbonCreditToken);
    }

    function submitProject(
        string memory name,
        string memory location,
        int256 latitude,
        int256 longitude,
        uint256 areaHectares,
        EcosystemType ecosystemType,
        string memory ipfsMetadata
    ) public returns (uint256) {
        uint256 projectId = _nextProjectId++;
        
        projects[projectId] = Project({
            id: projectId,
            owner: msg.sender,
            name: name,
            location: location,
            latitude: latitude,
            longitude: longitude,
            areaHectares: areaHectares,
            ecosystemType: ecosystemType,
            status: ProjectStatus.Pending,
            ipfsMetadata: ipfsMetadata,
            createdAt: block.timestamp,
            approvedAt: 0,
            approvedBy: address(0),
            estimatedCredits: calculateEstimatedCredits(areaHectares, ecosystemType),
            issuedCredits: 0
        });

        userProjects[msg.sender].push(projectId);
        emit ProjectSubmitted(projectId, msg.sender);
        return projectId;
    }

    function approveProject(uint256 projectId) public onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].status == ProjectStatus.Pending, "Invalid project status");
        
        projects[projectId].status = ProjectStatus.Approved;
        projects[projectId].approvedAt = block.timestamp;
        projects[projectId].approvedBy = msg.sender;
        
        emit ProjectApproved(projectId, msg.sender);
    }

    function rejectProject(uint256 projectId) public onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].status == ProjectStatus.Pending, "Invalid project status");
        
        projects[projectId].status = ProjectStatus.Rejected;
        emit ProjectRejected(projectId, msg.sender);
    }

    function issueCredits(uint256 projectId, uint256 amount) public onlyRole(ADMIN_ROLE) {
        require(projects[projectId].status == ProjectStatus.Approved, "Project not approved");
        
        Project storage project = projects[projectId];
        
        carbonCreditToken.mintCredit(
            project.owner,
            amount,
            projectId,
            project.location,
            project.areaHectares,
            toString(project.ecosystemType),
            project.ipfsMetadata
        );
        
        project.issuedCredits += amount;
        emit CreditsIssued(projectId, amount);
    }

    function calculateEstimatedCredits(uint256 areaHectares, EcosystemType ecosystemType) 
        internal pure returns (uint256) {
        // Simplified calculation - in reality, this would be more complex
        uint256 baseRate;
        if (ecosystemType == EcosystemType.Mangrove) {
            baseRate = 10; // 10 credits per hectare per year
        } else if (ecosystemType == EcosystemType.Seagrass) {
            baseRate = 8;
        } else if (ecosystemType == EcosystemType.SaltMarsh) {
            baseRate = 6;
        } else {
            baseRate = 5;
        }
        return areaHectares * baseRate;
    }

    function toString(EcosystemType ecosystemType) internal pure returns (string memory) {
        if (ecosystemType == EcosystemType.Mangrove) return "Mangrove";
        if (ecosystemType == EcosystemType.Seagrass) return "Seagrass";
        if (ecosystemType == EcosystemType.SaltMarsh) return "Salt Marsh";
        return "Kelp";
    }

    function getUserProjects(address user) public view returns (uint256[] memory) {
        return userProjects[user];
    }
}