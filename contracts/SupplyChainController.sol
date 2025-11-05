// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControlManager.sol";
import "./ProductRegistry.sol";
import "./ProvenanceTracker.sol";

contract SupplyChainController {
    AccessControlManager public access;
    ProductRegistry public registry;
    ProvenanceTracker public provenance;

    constructor(address _access, address _registry, address _provenance) {
        access = AccessControlManager(_access);
        registry = ProductRegistry(_registry);
        provenance = ProvenanceTracker(_provenance);
    }

    function registerAndLog(
        address to,
        string calldata ipfsCid,
        string calldata tokenURI,
        string calldata initialStatus
    ) external {
        uint256 tokenId = registry.registerProduct(to, ipfsCid, tokenURI, initialStatus);
        provenance.addEvent(tokenId, "CREATED", ipfsCid);
    }
}
