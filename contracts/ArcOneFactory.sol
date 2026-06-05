// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ArcMemecoin
 * @dev Standard ERC20 token representing a launched memecoin on Arc One.
 * Mints the initial supply (with decimals) to the creator.
 * Includes a one-time trading activation for future DEX integration.
 */
contract ArcMemecoin is ERC20 {
    address public creator;

    // Future DEX compatibility
    bool public tradingEnabled;
    address public pairAddress;

    // Metadata URI for logo, description, socials etc.
    string public metadataURI;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _creator,
        string memory _metadataURI
    ) ERC20(name, symbol) {
        creator = _creator;
        metadataURI = _metadataURI;
        // Mint with proper decimals (e.g. 1000000 becomes 1000000 * 10^18)
        _mint(_creator, initialSupply * 10 ** decimals());
        tradingEnabled = false;
    }

    /**
     * @dev Activates trading and sets the DEX pair address.
     * Can only be called once by the token creator.
     */
    function enableTrading(address _pairAddress) external {
        require(msg.sender == creator, "ArcMemecoin: not authorized");
        require(!tradingEnabled, "ArcMemecoin: trading already enabled");
        require(_pairAddress != address(0), "ArcMemecoin: invalid pair address");
        tradingEnabled = true;
        pairAddress = _pairAddress;
    }
}

/**
 * @title ArcOneFactory
 * @dev Factory contract for deploying ArcMemecoins on Arc One.
 *
 * Features:
 *   - ERC20 token deployment with validated inputs
 *   - Builder stats tracking (launch count, timestamps)
 *   - Metadata URI per launch for future logo/description storage
 *   - Event emission for off-chain indexing
 *   - Future DEX compatibility via ArcMemecoin.enableTrading()
 */
contract ArcOneFactory {
    // --- Data Structures ---

    struct TokenLaunch {
        address creator;
        address tokenAddress;
        string name;
        string symbol;
        uint256 supply;
        uint256 timestamp;
        string metadataURI;
        // Future DEX fields
        bool tradingEnabled;
        address pairAddress;
        uint256 volume;
    }

    struct BuilderStat {
        uint256 launchCount;
        uint256 firstLaunchTimestamp;
        uint256 lastLaunchTimestamp;
    }

    // --- State Variables ---

    TokenLaunch[] public allLaunches;
    mapping(address => TokenLaunch[]) public creatorLaunches;
    mapping(address => BuilderStat) public builderStats;
    mapping(address => bool) public isArcMemecoin;

    // --- Events ---

    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 supply,
        string metadataURI,
        uint256 timestamp
    );

    event BuilderUpdated(
        address indexed creator,
        uint256 launchCount,
        uint256 lastLaunchTimestamp
    );

    // --- Functions ---

    /**
     * @dev Deploys a new ArcMemecoin and tracks the launch.
     * @param name       Token name (cannot be empty).
     * @param symbol     Token symbol (cannot be empty).
     * @param supply     Initial supply in whole tokens, must be > 0 (decimals applied automatically).
     * @param metadataURI  URI pointing to token metadata (logo, description, socials). Can be empty.
     */
    function launchMemecoin(
        string memory name,
        string memory symbol,
        uint256 supply,
        string memory metadataURI
    ) external returns (address) {
        // --- Input Validation ---
        require(bytes(name).length > 0, "ArcOneFactory: name cannot be empty");
        require(bytes(symbol).length > 0, "ArcOneFactory: symbol cannot be empty");
        require(supply > 0, "ArcOneFactory: supply must be greater than zero");

        // 1. Deploy the token (supply * 10^18 is handled inside the constructor)
        ArcMemecoin newToken = new ArcMemecoin(name, symbol, supply, msg.sender, metadataURI);
        address tokenAddress = address(newToken);

        isArcMemecoin[tokenAddress] = true;

        // 2. Track the launch
        TokenLaunch memory newLaunch = TokenLaunch({
            creator: msg.sender,
            tokenAddress: tokenAddress,
            name: name,
            symbol: symbol,
            supply: supply,
            timestamp: block.timestamp,
            metadataURI: metadataURI,
            tradingEnabled: false,
            pairAddress: address(0),
            volume: 0
        });

        allLaunches.push(newLaunch);
        creatorLaunches[msg.sender].push(newLaunch);

        // 3. Update Builder Stats
        BuilderStat storage stat = builderStats[msg.sender];
        if (stat.launchCount == 0) {
            stat.firstLaunchTimestamp = block.timestamp;
        }
        stat.launchCount += 1;
        stat.lastLaunchTimestamp = block.timestamp;

        // 4. Emit Events
        emit TokenCreated(
            msg.sender,
            tokenAddress,
            name,
            symbol,
            supply,
            metadataURI,
            block.timestamp
        );

        emit BuilderUpdated(
            msg.sender,
            stat.launchCount,
            stat.lastLaunchTimestamp
        );

        return tokenAddress;
    }

    // --- View Helpers ---

    function getAllLaunches() external view returns (TokenLaunch[] memory) {
        return allLaunches;
    }

    function getCreatorLaunches(address creator) external view returns (TokenLaunch[] memory) {
        return creatorLaunches[creator];
    }

    function getTotalLaunches() external view returns (uint256) {
        return allLaunches.length;
    }
}
