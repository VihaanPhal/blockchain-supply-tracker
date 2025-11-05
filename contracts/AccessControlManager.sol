// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AccessControlManager is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE     = keccak256("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE    = keccak256("REGULATOR_ROLE");

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function grantManufacturer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    function grantDistributor(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DISTRIBUTOR_ROLE, account);
    }

    function grantRetailer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }

    function grantRegulator(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(REGULATOR_ROLE, account);
    }

    function hasSupplyRole(address account) external view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, account)
            || hasRole(DISTRIBUTOR_ROLE, account)
            || hasRole(RETAILER_ROLE, account)
            || hasRole(REGULATOR_ROLE, account);
    }
}
