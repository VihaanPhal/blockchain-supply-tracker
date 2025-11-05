// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
 
import "./AccessControlManager.sol";
 
contract ProvenanceTracker {
    AccessControlManager public accessControl;
 
    struct HistoryEvent {
        address by;
        string action;
        string ipfsCid;
        uint256 timestamp;
    }
 
    // tokenId => list of events
    mapping(uint256 => HistoryEvent[]) private _history;
 
    event StatusUpdated(uint256 indexed tokenId, address indexed by, string action, string ipfsCid);
 
    constructor(address _accessControl) {
        accessControl = AccessControlManager(_accessControl);
    }
 
    function addEvent(uint256 tokenId, string calldata action, string calldata ipfsCid) external {
        require(accessControl.hasSupplyRole(msg.sender), "Not authorized");
 
        _history[tokenId].push(HistoryEvent({
            by: msg.sender,
            action: action,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp
        }));
 
        emit StatusUpdated(tokenId, msg.sender, action, ipfsCid);
    }
 
    function getHistoryCount(uint256 tokenId) external view returns (uint256) {
        return _history[tokenId].length;
    }
 
    function getHistoryEntry(uint256 tokenId, uint256 index) external view returns (
        address by,
        string memory action,
        string memory ipfsCid,
        uint256 timestamp
    ) {
        HistoryEvent storage e = _history[tokenId][index];
        return (e.by, e.action, e.ipfsCid, e.timestamp);
    }
}
 
