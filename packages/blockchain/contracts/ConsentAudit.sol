// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ConsentAudit
 * @dev Smart contract for managing healthcare consent and audit logging
 * @notice This contract handles consent grants, revocations, and access logging
 */
contract ConsentAudit is Ownable {
    using Strings for uint256;

    // Events
    event ConsentGranted(
        address indexed patient,
        address indexed provider,
        bytes32 indexed consentHash,
        uint256 timestamp,
        string resourceType,
        string resourceId
    );

    event ConsentRevoked(
        address indexed patient,
        address indexed provider,
        bytes32 indexed consentHash,
        uint256 timestamp
    );

    event AccessLogged(
        address indexed provider,
        bytes32 indexed consentHash,
        uint256 timestamp,
        string resourceType,
        string resourceId,
        string accessType
    );

    event ConsentExpired(
        bytes32 indexed consentHash,
        uint256 timestamp
    );

    // Structs
    struct Consent {
        address patient;
        address provider;
        bytes32 consentHash;
        uint256 grantedAt;
        uint256 expiresAt;
        string resourceType;
        string resourceId;
        bool isActive;
        bool isRevoked;
    }

    struct AccessLog {
        address provider;
        bytes32 consentHash;
        uint256 timestamp;
        string resourceType;
        string resourceId;
        string accessType;
    }

    // State variables
    mapping(bytes32 => Consent) public consents;
    mapping(bytes32 => AccessLog[]) public accessLogs;
    mapping(address => bytes32[]) public patientConsents;
    mapping(address => bytes32[]) public providerConsents;

    uint256 public consentExpiryDays = 365 days;
    uint256 public totalConsents;
    uint256 public totalAccessLogs;

    // Modifiers
    modifier onlyConsentOwner(bytes32 consentHash) {
        require(
            consents[consentHash].patient == msg.sender || 
            consents[consentHash].provider == msg.sender,
            "Not authorized"
        );
        _;
    }

    modifier consentExists(bytes32 consentHash) {
        require(consents[consentHash].patient != address(0), "Consent does not exist");
        _;
    }

    modifier consentActive(bytes32 consentHash) {
        require(consents[consentHash].isActive, "Consent is not active");
        require(!consents[consentHash].isRevoked, "Consent is revoked");
        require(consents[consentHash].expiresAt > block.timestamp, "Consent has expired");
        _;
    }

    // Constructor
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Grant consent for a specific resource
     * @param patient Address of the patient
     * @param resourceType Type of FHIR resource
     * @param resourceId ID of the resource
     * @param payloadHash Hash of the consent payload
     */
    function grantConsent(
        address patient,
        string memory resourceType,
        string memory resourceId,
        bytes32 payloadHash
    ) external {
        require(patient != address(0), "Invalid patient address");
        require(bytes(resourceType).length > 0, "Resource type cannot be empty");
        require(bytes(resourceId).length > 0, "Resource ID cannot be empty");

        bytes32 consentHash = keccak256(
            abi.encodePacked(
                patient,
                msg.sender,
                resourceType,
                resourceId,
                payloadHash,
                block.timestamp
            )
        );

        require(consents[consentHash].patient == address(0), "Consent already exists");

        Consent memory newConsent = Consent({
            patient: patient,
            provider: msg.sender,
            consentHash: consentHash,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + consentExpiryDays,
            resourceType: resourceType,
            resourceId: resourceId,
            isActive: true,
            isRevoked: false
        });

        consents[consentHash] = newConsent;
        patientConsents[patient].push(consentHash);
        providerConsents[msg.sender].push(consentHash);
        totalConsents++;

        emit ConsentGranted(
            patient,
            msg.sender,
            consentHash,
            block.timestamp,
            resourceType,
            resourceId
        );
    }

    /**
     * @dev Check if consent is valid for a specific access
     * @param consentHash Hash of the consent to check
     * @param resourceType Type of resource being accessed
     * @param resourceId ID of resource being accessed
     * @return bool True if consent is valid
     */
    function checkConsent(
        bytes32 consentHash,
        string memory resourceType,
        string memory resourceId
    ) external view returns (bool) {
        Consent memory consent = consents[consentHash];
        
        if (consent.patient == address(0)) return false;
        if (!consent.isActive) return false;
        if (consent.isRevoked) return false;
        if (consent.expiresAt <= block.timestamp) return false;
        
        // Check if resource matches consent
        return (
            keccak256(bytes(consent.resourceType)) == keccak256(bytes(resourceType)) &&
            keccak256(bytes(consent.resourceId)) == keccak256(bytes(resourceId))
        );
    }

    /**
     * @dev Log access to a resource
     * @param consentHash Hash of the consent being used
     * @param resourceType Type of resource accessed
     * @param resourceId ID of resource accessed
     * @param accessType Type of access (read, write, delete)
     */
    function logAccess(
        bytes32 consentHash,
        string memory resourceType,
        string memory resourceId,
        string memory accessType
    ) external consentExists(consentHash) consentActive(consentHash) {
        require(
            consents[consentHash].provider == msg.sender,
            "Only consent provider can log access"
        );

        AccessLog memory log = AccessLog({
            provider: msg.sender,
            consentHash: consentHash,
            timestamp: block.timestamp,
            resourceType: resourceType,
            resourceId: resourceId,
            accessType: accessType
        });

        accessLogs[consentHash].push(log);
        totalAccessLogs++;

        emit AccessLogged(
            msg.sender,
            consentHash,
            block.timestamp,
            resourceType,
            resourceId,
            accessType
        );
    }

    /**
     * @dev Revoke consent
     * @param consentHash Hash of the consent to revoke
     */
    function revokeConsent(bytes32 consentHash) 
        external 
        consentExists(consentHash) 
        onlyConsentOwner(consentHash) 
    {
        consents[consentHash].isRevoked = true;
        consents[consentHash].isActive = false;

        emit ConsentRevoked(
            consents[consentHash].patient,
            consents[consentHash].provider,
            consentHash,
            block.timestamp
        );
    }

    /**
     * @dev Get consent details
     * @param consentHash Hash of the consent
     * @return Consent struct with all details
     */
    function getConsent(bytes32 consentHash) 
        external 
        view 
        consentExists(consentHash) 
        returns (Consent memory) 
    {
        return consents[consentHash];
    }

    /**
     * @dev Get all consents for a patient
     * @param patient Address of the patient
     * @return Array of consent hashes
     */
    function getPatientConsents(address patient) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return patientConsents[patient];
    }

    /**
     * @dev Get all consents granted by a provider
     * @param provider Address of the provider
     * @return Array of consent hashes
     */
    function getProviderConsents(address provider) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return providerConsents[provider];
    }

    /**
     * @dev Get access logs for a consent
     * @param consentHash Hash of the consent
     * @return Array of AccessLog structs
     */
    function getAccessLogs(bytes32 consentHash) 
        external 
        view 
        consentExists(consentHash) 
        returns (AccessLog[] memory) 
    {
        return accessLogs[consentHash];
    }

    /**
     * @dev Check if consent has expired
     * @param consentHash Hash of the consent
     * @return bool True if expired
     */
    function isConsentExpired(bytes32 consentHash) 
        external 
        view 
        consentExists(consentHash) 
        returns (bool) 
    {
        return consents[consentHash].expiresAt <= block.timestamp;
    }

    /**
     * @dev Clean up expired consents (only owner)
     */
    function cleanupExpiredConsents() external onlyOwner {
        // This is a simplified cleanup - in production you might want batch processing
        // or a more sophisticated cleanup mechanism
    }

    /**
     * @dev Set consent expiry period (only owner)
     * @param days_ Number of days for consent expiry
     */
    function setConsentExpiryDays(uint256 days_) external onlyOwner {
        require(days_ > 0, "Expiry days must be positive");
        consentExpiryDays = days_ * 1 days;
    }

    /**
     * @dev Get contract statistics
     * @return totalConsents Total number of consents
     * @return totalAccessLogs Total number of access logs
     * @return consentExpiryDays Current expiry period in days
     */
    function getStats() external view returns (
        uint256 totalConsents_,
        uint256 totalAccessLogs_,
        uint256 consentExpiryDays_
    ) {
        return (totalConsents, totalAccessLogs, consentExpiryDays / 1 days);
    }

    /**
     * @dev Emergency pause (only owner)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause functionality
        // This would require additional state management
    }
} 