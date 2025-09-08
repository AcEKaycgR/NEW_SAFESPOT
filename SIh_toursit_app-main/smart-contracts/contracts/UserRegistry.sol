// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserRegistry is Ownable {
    mapping(address => bytes) private _users;

    event UserRegistered(address indexed user, bytes data);

    constructor() Ownable(msg.sender) {}

    function registerUser(bytes calldata data) external {
        require(_users[msg.sender].length == 0, "User already registered");
        _users[msg.sender] = data;
        emit UserRegistered(msg.sender, data);
    }

    function getUser(address userAddress) external view returns (bytes memory) {
        require(msg.sender == userAddress || owner() == msg.sender, "You can only retrieve your own data");
        return _users[userAddress];
    }
}
