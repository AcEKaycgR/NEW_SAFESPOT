import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("LocationRegistry", function () {
  let LocationRegistry;
  let locationRegistry;
  let owner;
  let emergencyService;
  let user;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    LocationRegistry = await ethers.getContractFactory("LocationRegistry");
    [owner, emergencyService, user, ...addrs] = await ethers.getSigners();

    // Deploy a fresh contract for each test
    locationRegistry = await LocationRegistry.deploy();
    await locationRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await locationRegistry.owner()).to.equal(owner.address);
    });

    it("Should have zero location hashes initially", async function () {
      const hashCount = await locationRegistry.getLocationHashCount(user.address);
      expect(hashCount).to.equal(0);
    });
  });

  describe("Emergency Service Management", function () {
    it("Should allow owner to authorize emergency services", async function () {
      await expect(locationRegistry.authorizeEmergencyService(emergencyService.address, "POLICE_001"))
        .to.emit(locationRegistry, "EmergencyServiceAuthorized")
        .withArgs(emergencyService.address, "POLICE_001");

      const isAuthorized = await locationRegistry.isAuthorizedEmergencyService(emergencyService.address);
      expect(isAuthorized).to.be.true;
    });

    it("Should prevent non-owner from authorizing emergency services", async function () {
      await expect(
        locationRegistry.connect(emergencyService).authorizeEmergencyService(emergencyService.address, "POLICE_001")
      ).to.be.revertedWithCustomError(locationRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to revoke emergency service authorization", async function () {
      // First authorize
      await locationRegistry.authorizeEmergencyService(emergencyService.address, "POLICE_001");
      
      // Then revoke
      await expect(locationRegistry.revokeEmergencyService(emergencyService.address))
        .to.emit(locationRegistry, "EmergencyServiceRevoked")
        .withArgs(emergencyService.address);

      const isAuthorized = await locationRegistry.isAuthorizedEmergencyService(emergencyService.address);
      expect(isAuthorized).to.be.false;
    });
  });

  describe("Location Hash Storage", function () {
    beforeEach(async function () {
      // Authorize emergency service for tests
      await locationRegistry.authorizeEmergencyService(emergencyService.address, "POLICE_001");
    });

    it("Should allow authorized emergency services to store location access hashes", async function () {
      const locationHash = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash"));
      const incidentId = "INC-001";
      
      await expect(
        locationRegistry.connect(emergencyService).storeLocationAccessHash(
          user.address,
          locationHash,
          incidentId
        )
      ).to.emit(locationRegistry, "LocationAccessLogged")
        .withArgs(user.address, emergencyService.address, locationHash, incidentId);

      const hashCount = await locationRegistry.getLocationHashCount(user.address);
      expect(hashCount).to.equal(1);
    });

    it("Should prevent unauthorized addresses from storing location hashes", async function () {
      const locationHash = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash"));
      const incidentId = "INC-001";
      
      await expect(
        locationRegistry.connect(user).storeLocationAccessHash(
          user.address,
          locationHash,
          incidentId
        )
      ).to.be.revertedWith("Only authorized emergency services");
    });

    it("Should retrieve location access logs correctly", async function () {
      const locationHash1 = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash_1"));
      const locationHash2 = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash_2"));
      const incidentId1 = "INC-001";
      const incidentId2 = "INC-002";

      // Store two location access logs
      await locationRegistry.connect(emergencyService).storeLocationAccessHash(
        user.address,
        locationHash1,
        incidentId1
      );
      
      await locationRegistry.connect(emergencyService).storeLocationAccessHash(
        user.address,
        locationHash2,
        incidentId2
      );

      // Retrieve logs
      const logs = await locationRegistry.getLocationAccessLogs(user.address, 0, 2);
      expect(logs.length).to.equal(2);
      expect(logs[0].locationHash).to.equal(locationHash1);
      expect(logs[0].incidentId).to.equal(incidentId1);
      expect(logs[0].emergencyService).to.equal(emergencyService.address);
      expect(logs[1].locationHash).to.equal(locationHash2);
      expect(logs[1].incidentId).to.equal(incidentId2);
    });

    it("Should handle pagination correctly", async function () {
      const hashes = [];
      const incidents = [];
      
      // Store 5 location access logs
      for (let i = 0; i < 5; i++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`location_data_hash_${i}`));
        const incident = `INC-00${i}`;
        hashes.push(hash);
        incidents.push(incident);
        
        await locationRegistry.connect(emergencyService).storeLocationAccessHash(
          user.address,
          hash,
          incident
        );
      }

      // Test pagination: get first 3
      const firstPage = await locationRegistry.getLocationAccessLogs(user.address, 0, 3);
      expect(firstPage.length).to.equal(3);
      expect(firstPage[0].incidentId).to.equal("INC-000");
      expect(firstPage[2].incidentId).to.equal("INC-002");

      // Test pagination: get next 2
      const secondPage = await locationRegistry.getLocationAccessLogs(user.address, 3, 2);
      expect(secondPage.length).to.equal(2);
      expect(secondPage[0].incidentId).to.equal("INC-003");
      expect(secondPage[1].incidentId).to.equal("INC-004");
    });
  });

  describe("Access Verification", function () {
    beforeEach(async function () {
      await locationRegistry.authorizeEmergencyService(emergencyService.address, "POLICE_001");
    });

    it("Should verify location access correctly", async function () {
      const locationHash = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash"));
      const incidentId = "INC-001";
      
      // Store the hash
      await locationRegistry.connect(emergencyService).storeLocationAccessHash(
        user.address,
        locationHash,
        incidentId
      );

      // Verify the access
      const isVerified = await locationRegistry.verifyLocationAccess(
        user.address,
        locationHash,
        emergencyService.address
      );
      expect(isVerified).to.be.true;
    });

    it("Should return false for unverified access", async function () {
      const locationHash = ethers.keccak256(ethers.toUtf8Bytes("location_data_hash"));
      
      // Try to verify without storing
      const isVerified = await locationRegistry.verifyLocationAccess(
        user.address,
        locationHash,
        emergencyService.address
      );
      expect(isVerified).to.be.false;
    });
  });

  describe("Gas Optimization", function () {
    beforeEach(async function () {
      await locationRegistry.authorizeEmergencyService(emergencyService.address, "POLICE_001");
    });

    it("Should handle batch storage efficiently", async function () {
      const hashes = [];
      const incidents = [];
      
      // Prepare batch data
      for (let i = 0; i < 10; i++) {
        hashes.push(ethers.keccak256(ethers.toUtf8Bytes(`batch_hash_${i}`)));
        incidents.push(`BATCH-${i.toString().padStart(3, '0')}`);
      }

      // Store in batch (if batch function exists)
      const tx = await locationRegistry.connect(emergencyService).batchStoreLocationAccessHash(
        user.address,
        hashes,
        incidents
      );
      
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(1500000); // Adjusted gas limit for batch operation

      // Verify all stored
      const count = await locationRegistry.getLocationHashCount(user.address);
      expect(count).to.equal(10);
    });
  });
});
