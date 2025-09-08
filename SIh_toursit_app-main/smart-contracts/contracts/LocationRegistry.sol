// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LocationRegistry
 * @dev Smart contract for managing emergency service access to location data with immutable logging
 */
contract LocationRegistry is Ownable {
    
    struct LocationAccessLog {
        bytes32 locationHash;
        address emergencyService;
        string incidentId;
        uint256 timestamp;
    }
    
    // Mapping from emergency service address to their service ID
    mapping(address => string) private authorizedServices;
    mapping(address => bool) private serviceAuthorized;
    
    // Mapping from user address to their location access logs
    mapping(address => LocationAccessLog[]) private userLocationLogs;
    
    // Mapping for quick verification: user => locationHash => emergencyService => exists
    mapping(address => mapping(bytes32 => mapping(address => bool))) private accessVerification;
    
    // Events
    event EmergencyServiceAuthorized(address indexed service, string serviceId);
    event EmergencyServiceRevoked(address indexed service);
    event LocationAccessLogged(
        address indexed user,
        address indexed emergencyService,
        bytes32 indexed locationHash,
        string incidentId
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Authorize an emergency service to access and log location data
     * @param serviceAddress Address of the emergency service
     * @param serviceId Identifier for the emergency service (e.g., "POLICE_001")
     */
    function authorizeEmergencyService(address serviceAddress, string calldata serviceId) external onlyOwner {
        require(serviceAddress != address(0), "Invalid service address");
        require(bytes(serviceId).length > 0, "Service ID cannot be empty");
        
        authorizedServices[serviceAddress] = serviceId;
        serviceAuthorized[serviceAddress] = true;
        
        emit EmergencyServiceAuthorized(serviceAddress, serviceId);
    }
    
    /**
     * @dev Revoke authorization for an emergency service
     * @param serviceAddress Address of the emergency service to revoke
     */
    function revokeEmergencyService(address serviceAddress) external onlyOwner {
        require(serviceAuthorized[serviceAddress], "Service not authorized");
        
        delete authorizedServices[serviceAddress];
        serviceAuthorized[serviceAddress] = false;
        
        emit EmergencyServiceRevoked(serviceAddress);
    }
    
    /**
     * @dev Check if an address is an authorized emergency service
     * @param serviceAddress Address to check
     * @return bool True if authorized, false otherwise
     */
    function isAuthorizedEmergencyService(address serviceAddress) external view returns (bool) {
        return serviceAuthorized[serviceAddress];
    }
    
    /**
     * @dev Store a location access hash for audit trail
     * @param userAddress Address of the user whose location was accessed
     * @param locationHash Hash of the location data accessed
     * @param incidentId Incident ID associated with the access
     */
    function storeLocationAccessHash(
        address userAddress,
        bytes32 locationHash,
        string calldata incidentId
    ) external {
        require(serviceAuthorized[msg.sender], "Only authorized emergency services");
        require(userAddress != address(0), "Invalid user address");
        require(locationHash != bytes32(0), "Invalid location hash");
        require(bytes(incidentId).length > 0, "Incident ID cannot be empty");
        
        LocationAccessLog memory newLog = LocationAccessLog({
            locationHash: locationHash,
            emergencyService: msg.sender,
            incidentId: incidentId,
            timestamp: block.timestamp
        });
        
        userLocationLogs[userAddress].push(newLog);
        accessVerification[userAddress][locationHash][msg.sender] = true;
        
        emit LocationAccessLogged(userAddress, msg.sender, locationHash, incidentId);
    }
    
    /**
     * @dev Batch store multiple location access hashes for gas optimization
     * @param userAddress Address of the user whose location was accessed
     * @param locationHashes Array of location data hashes
     * @param incidentIds Array of incident IDs
     */
    function batchStoreLocationAccessHash(
        address userAddress,
        bytes32[] calldata locationHashes,
        string[] calldata incidentIds
    ) external {
        require(serviceAuthorized[msg.sender], "Only authorized emergency services");
        require(userAddress != address(0), "Invalid user address");
        require(locationHashes.length == incidentIds.length, "Arrays length mismatch");
        require(locationHashes.length > 0, "Empty arrays");
        require(locationHashes.length <= 50, "Batch size too large"); // Gas optimization limit
        
        for (uint256 i = 0; i < locationHashes.length; i++) {
            require(locationHashes[i] != bytes32(0), "Invalid location hash");
            require(bytes(incidentIds[i]).length > 0, "Incident ID cannot be empty");
            
            LocationAccessLog memory newLog = LocationAccessLog({
                locationHash: locationHashes[i],
                emergencyService: msg.sender,
                incidentId: incidentIds[i],
                timestamp: block.timestamp
            });
            
            userLocationLogs[userAddress].push(newLog);
            accessVerification[userAddress][locationHashes[i]][msg.sender] = true;
            
            emit LocationAccessLogged(userAddress, msg.sender, locationHashes[i], incidentIds[i]);
        }
    }
    
    /**
     * @dev Verify if a specific location access was logged
     * @param userAddress Address of the user
     * @param locationHash Hash of the location data
     * @param emergencyService Address of the emergency service
     * @return bool True if access was logged, false otherwise
     */
    function verifyLocationAccess(
        address userAddress,
        bytes32 locationHash,
        address emergencyService
    ) external view returns (bool) {
        return accessVerification[userAddress][locationHash][emergencyService];
    }
    
    /**
     * @dev Get the number of location access logs for a user
     * @param userAddress Address of the user
     * @return uint256 Number of access logs
     */
    function getLocationHashCount(address userAddress) external view returns (uint256) {
        return userLocationLogs[userAddress].length;
    }
    
    /**
     * @dev Get location access logs for a user with pagination
     * @param userAddress Address of the user
     * @param offset Starting index
     * @param limit Maximum number of logs to return
     * @return LocationAccessLog[] Array of location access logs
     */
    function getLocationAccessLogs(
        address userAddress,
        uint256 offset,
        uint256 limit
    ) external view returns (LocationAccessLog[] memory) {
        LocationAccessLog[] storage logs = userLocationLogs[userAddress];
        
        if (offset >= logs.length) {
            return new LocationAccessLog[](0);
        }
        
        uint256 end = offset + limit;
        if (end > logs.length) {
            end = logs.length;
        }
        
        uint256 resultLength = end - offset;
        LocationAccessLog[] memory result = new LocationAccessLog[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = logs[offset + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get the service ID for an authorized emergency service
     * @param serviceAddress Address of the emergency service
     * @return string Service ID
     */
    function getServiceId(address serviceAddress) external view returns (string memory) {
        require(serviceAuthorized[serviceAddress], "Service not authorized");
        return authorizedServices[serviceAddress];
    }
}
