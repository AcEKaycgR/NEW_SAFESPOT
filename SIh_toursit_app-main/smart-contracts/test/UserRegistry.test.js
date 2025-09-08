import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("UserRegistry", function () {
  let UserRegistry, userRegistry, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await userRegistry.owner()).to.equal(owner.address);
    });
  });

  describe("User Registration", function () {
    it("Should allow a user to register", async function () {
      const userData = "0x" + Buffer.from("testuser").toString("hex");
      await expect(userRegistry.connect(addr1).registerUser(userData))
        .to.emit(userRegistry, "UserRegistered")
        .withArgs(addr1.address, userData);

      const storedUserData = await userRegistry.getUser(addr1.address);
      expect(storedUserData).to.equal(userData);
    });

    it("Should not allow a user to register twice", async function () {
      const userData = "0x" + Buffer.from("testuser").toString("hex");
      await userRegistry.connect(addr1).registerUser(userData);

      await expect(
        userRegistry.connect(addr1).registerUser(userData)
      ).to.be.revertedWith("User already registered");
    });

    it("Should only allow the user to get their own data", async function () {
        const userData = "0x" + Buffer.from("testuser").toString("hex");
        await userRegistry.connect(addr1).registerUser(userData);

        await expect(userRegistry.connect(addr2).getUser(addr1.address))
            .to.be.revertedWith("You can only retrieve your own data");
    });
  });

  describe("Admin functions", function () {
    it("Should allow the owner to get any user's data", async function () {
        const userData = "0x" + Buffer.from("testuser").toString("hex");
        await userRegistry.connect(addr1).registerUser(userData);

        const storedUserData = await userRegistry.connect(owner).getUser(addr1.address);
        expect(storedUserData).to.equal(userData);
    });
  });
});
