// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArcDexPair
 * @dev Simple Constant Product AMM (x * y = k) for a specific ERC20 Token vs ETH.
 */
contract ArcDexPair {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable factory;

    uint256 public reserveToken;
    uint256 public reserveETH;

    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount);
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, bool isEthToToken);

    constructor(address _token) {
        token = IERC20(_token);
        factory = msg.sender;
    }

    /**
     * @dev Adds initial liquidity to the pool.
     * Only works when pool is empty. For a simple DEX, we might only allow one initial LP add.
     */
    function addLiquidity(uint256 tokenAmount) external payable {
        require(reserveToken == 0 && reserveETH == 0, "ArcDex: Liquidity already exists");
        require(tokenAmount > 0 && msg.value > 0, "ArcDex: Invalid amounts");

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        reserveToken = tokenAmount;
        reserveETH = msg.value;

        emit LiquidityAdded(msg.sender, tokenAmount, msg.value);
    }

    /**
     * @dev Swaps ETH for Tokens
     */
    function swapETHForTokens() external payable {
        require(msg.value > 0, "ArcDex: Zero ETH input");
        require(reserveToken > 0 && reserveETH > 0, "ArcDex: Insufficient liquidity");

        // Constant product formula: (reserveETH + msg.value) * (reserveToken - amountOut) = reserveETH * reserveToken
        // amountOut = (reserveToken * msg.value) / (reserveETH + msg.value)
        // With a 0.3% fee: amountOut = (reserveToken * (msg.value * 997 / 1000)) / (reserveETH + (msg.value * 997 / 1000))
        
        uint256 amountInWithFee = msg.value * 997;
        uint256 numerator = amountInWithFee * reserveToken;
        uint256 denominator = (reserveETH * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut > 0, "ArcDex: Insufficient output amount");
        require(amountOut < reserveToken, "ArcDex: Insufficient liquidity");

        reserveETH += msg.value;
        reserveToken -= amountOut;

        token.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, msg.value, amountOut, true);
    }

    /**
     * @dev Swaps Tokens for ETH
     */
    function swapTokensForETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "ArcDex: Zero token input");
        require(reserveToken > 0 && reserveETH > 0, "ArcDex: Insufficient liquidity");

        // amountOut = (reserveETH * tokenAmount) / (reserveToken + tokenAmount)
        // With a 0.3% fee
        
        uint256 amountInWithFee = tokenAmount * 997;
        uint256 numerator = amountInWithFee * reserveETH;
        uint256 denominator = (reserveToken * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut > 0, "ArcDex: Insufficient output amount");
        require(amountOut < reserveETH, "ArcDex: Insufficient liquidity");

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        reserveToken += tokenAmount;
        reserveETH -= amountOut;

        (bool success, ) = msg.sender.call{value: amountOut}("");
        require(success, "ArcDex: ETH transfer failed");

        emit Swap(msg.sender, tokenAmount, amountOut, false);
    }

    // Fallback to receive ETH
    receive() external payable {}
}

/**
 * @title ArcDexFactory
 * @dev Factory to create ArcDexPairs.
 */
contract ArcDexFactory {
    mapping(address => address) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token, address pair, uint256);

    function createPair(address token) external returns (address pair) {
        require(token != address(0), "ArcDexFactory: ZERO_ADDRESS");
        require(getPair[token] == address(0), "ArcDexFactory: PAIR_EXISTS");

        ArcDexPair newPair = new ArcDexPair(token);
        pair = address(newPair);

        getPair[token] = pair;
        allPairs.push(pair);

        emit PairCreated(token, pair, allPairs.length);
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}
