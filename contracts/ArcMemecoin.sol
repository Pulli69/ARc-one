// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/// @title Arc Memecoin
/// @notice ERC-20 token launched via ArcPumpFactory
contract ArcMemecoin is ERC20 {
    address public immutable factory;
    address public immutable creator;
    string public metadataURI;
    error NotFactory();
    error ZeroAddress();
    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }
    /// @notice Constructor for ArcMemecoin
    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        string memory metadataURI_
    ) ERC20(name_, symbol_) {
        if (creator_ == address(0)) revert ZeroAddress();
        
        factory = msg.sender;
        creator = creator_;
        metadataURI = metadataURI_;
    }
    /// @notice Mints new tokens. Only callable by the factory.
    function mint(address to, uint256 amount) external onlyFactory {
        _mint(to, amount);
    }
    /// @notice Burns tokens from a specific address. Only callable by the factory.
    function burn(address from, uint256 amount) external onlyFactory {
        _burn(from, amount);
    }
}
