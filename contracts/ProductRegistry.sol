// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./AccessControlManager.sol";

contract ProductRegistry is ERC721URIStorage {
    AccessControlManager public accessControl;

    uint256 private _nextId = 1;
    mapping(uint256 => string) public ipfsCids;
    mapping(uint256 => string) public status;

    event ProductRegistered(uint256 indexed tokenId, address indexed manufacturer, string ipfsCid, string tokenURI);
    event ProductTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor(address _accessControl) ERC721("SupplyChainProduct", "SCP") {
        accessControl = AccessControlManager(_accessControl);
    }

    function registerProduct(
        address to,
        string calldata ipfsCid,
        string calldata tokenURI,
        string calldata initialStatus
    ) external returns (uint256) {
        require(accessControl.hasRole(accessControl.MANUFACTURER_ROLE(), msg.sender),
                "Not manufacturer");

        uint256 tokenId = _nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        ipfsCids[tokenId] = ipfsCid;
        status[tokenId] = initialStatus;

        emit ProductRegistered(tokenId, msg.sender, ipfsCid, tokenURI);
        return tokenId;
    }

    function transferProduct(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        safeTransferFrom(from, to, tokenId);
        emit ProductTransferred(tokenId, from, to);
    }

    function updateStatus(uint256 tokenId, string calldata newStatus) external {
        require(accessControl.hasSupplyRole(msg.sender), "Not authorized");
        status[tokenId] = newStatus;
    }

    function getProductInfo(uint256 tokenId) external view returns (
        address owner,
        string memory tokenURI_,
        string memory cid,
        string memory currentStatus
    ) {
        owner = ownerOf(tokenId);
        tokenURI_ = tokenURI(tokenId);
        cid = ipfsCids[tokenId];
        currentStatus = status[tokenId];
    }
}
