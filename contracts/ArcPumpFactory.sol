// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ArcMemecoin.sol";

interface IArcDEX {
    function createPoolAndLock(address token, uint256 usdcAmount, uint256 tokenAmount) external returns (address pool);
}

/// @title ArcPumpFactory
contract ArcPumpFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct CurveState {
        uint256 virtualUsdcReserve;
        uint256 virtualTokenReserve;
        uint256 realUsdcAccumulated;
        uint256 tokensSold;
        uint256 tokenGraduationThreshold;
        bool graduated;
        bool pendingDexPool;
    }
    
    uint256 public constant INITIAL_VIRTUAL_USDC_RESERVE = 300_000_000; // 300 USDC (6 dec)
    uint256 public constant INITIAL_VIRTUAL_TOKEN_RESERVE = 1_000_000_000 * 1e18; // 1B tokens (18 dec)
    uint256 public constant PROTOCOL_FEE_BPS = 50; // 0.5%
    
    address public admin;
    address public pendingAdmin;
    IERC20 public immutable usdc;
    
    uint256 public launchFee = 100_000; // 0.1 USDC (6 dec)
    uint256 public graduationThreshold = 3_000_000; // 3 USDC (6 dec)
    address public dexRouter;
    address public pendingDexRouter;
    uint256 public dexRouterTimelock;
    
    uint256 public accumulatedProtocolFees;
    
    mapping(address => CurveState) public curveStates;
    mapping(address => bool) public isArcPumpToken;
    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    
    event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, string metadataURI, uint256 timestamp);
    event TokensBought(address indexed token, address indexed buyer, uint256 usdcIn, uint256 tokenOut, uint256 newPrice, uint256 fee);
    event TokensSold(address indexed token, address indexed seller, uint256 tokenIn, uint256 usdcOut, uint256 newPrice, uint256 fee);
    event TokenGraduated(address indexed token, address indexed pool, uint256 usdcMigrated, uint256 tokensMigrated);
    event TokenReadyForGraduation(address indexed token, uint256 usdcAccumulated, uint256 timestamp);
    event CreatorAllocated(address indexed token, address indexed creator, uint256 amount);
    event DexRouterProposed(address indexed proposed, uint256 executeAfter);
    event DexRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event AdminProposed(address indexed proposedAdmin);
    event AdminAccepted(address indexed newAdmin);
    event CreatorRewarded(address indexed token, address indexed creator, uint256 amount);
    
    error NotAdmin();
    error NotArcPumpToken();
    error AwaitingDexPool();
    error ThresholdNotReached();
    error SlippageExceeded();
    error ZeroAmount();
    error ZeroAddress();
    error TimelockNotExpired();
    error NoPendingRouter();
    error InsufficientReserve();
    error AlreadyGraduated();
    error AlreadyPending();
    error NotPending();
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }
    
    constructor(address _usdc, address _initialAdmin) {
        if (_usdc == address(0) || _initialAdmin == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        admin = _initialAdmin;
    }
    
    function proposeAdmin(address _pendingAdmin) external onlyAdmin {
        pendingAdmin = _pendingAdmin;
        emit AdminProposed(_pendingAdmin);
    }
    
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotAdmin();
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminAccepted(admin);
    }
    
    function proposeDexRouter(address _dexRouter) external onlyAdmin {
        pendingDexRouter = _dexRouter;
        dexRouterTimelock = block.timestamp + 2 days;
        emit DexRouterProposed(_dexRouter, dexRouterTimelock);
    }
    
    function executeDexRouter() external onlyAdmin {
        if (pendingDexRouter == address(0)) revert NoPendingRouter();
        if (block.timestamp < dexRouterTimelock) revert TimelockNotExpired();
        address oldRouter = dexRouter;
        dexRouter = pendingDexRouter;
        pendingDexRouter = address(0);
        
        emit DexRouterUpdated(oldRouter, dexRouter);
    }
    
    function setGraduationThreshold(uint256 _threshold) external onlyAdmin {
        graduationThreshold = _threshold;
    }
    
    function setLaunchFee(uint256 _fee) external onlyAdmin {
        launchFee = _fee;
    }
    
    function launchMemecoin(string memory name, string memory symbol, string memory metadataURI) external nonReentrant returns (address) {
        if (launchFee > 0) {
            usdc.safeTransferFrom(msg.sender, address(this), launchFee);
            accumulatedProtocolFees += launchFee; // FIX: Track the launch fee
        }
        
        ArcMemecoin token = new ArcMemecoin(name, symbol, msg.sender, metadataURI);
        address tokenAddress = address(token);
        
        isArcPumpToken[tokenAddress] = true;
        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        uint256 creatorAllocation = (INITIAL_VIRTUAL_TOKEN_RESERVE * 200) / 10000;
        
        curveStates[tokenAddress] = CurveState({
            virtualUsdcReserve: INITIAL_VIRTUAL_USDC_RESERVE,
            virtualTokenReserve: INITIAL_VIRTUAL_TOKEN_RESERVE - creatorAllocation,
            realUsdcAccumulated: 0,
            tokensSold: creatorAllocation,
            tokenGraduationThreshold: graduationThreshold,
            graduated: false,
            pendingDexPool: false
        });
        
        ArcMemecoin(tokenAddress).mint(msg.sender, creatorAllocation);
        
        emit TokenCreated(msg.sender, tokenAddress, name, symbol, metadataURI, block.timestamp);
        emit CreatorAllocated(tokenAddress, msg.sender, creatorAllocation);
        
        return tokenAddress;
    }
    
    function buyTokens(address token, uint256 usdcIn, uint256 minTokenOut) external nonReentrant {
        if (!isArcPumpToken[token]) revert NotArcPumpToken();
        if (usdcIn == 0) revert ZeroAmount();
        
        CurveState storage state = curveStates[token];
        if (state.graduated) revert AlreadyGraduated();
        if (state.pendingDexPool) revert AwaitingDexPool();
        
        uint256 fee = (usdcIn * PROTOCOL_FEE_BPS) / 10000;
        uint256 usdcNet = usdcIn - fee;
        
        accumulatedProtocolFees += fee;
        
        uint256 tokenOut = (state.virtualTokenReserve * usdcNet) / (state.virtualUsdcReserve + usdcNet);
        if (tokenOut < minTokenOut) revert SlippageExceeded();
        if (tokenOut >= state.virtualTokenReserve) revert InsufficientReserve();
        
        usdc.safeTransferFrom(msg.sender, address(this), usdcIn);
        
        state.virtualUsdcReserve += usdcNet;
        state.virtualTokenReserve -= tokenOut;
        state.realUsdcAccumulated += usdcNet;
        state.tokensSold += tokenOut;
        
        ArcMemecoin(token).mint(msg.sender, tokenOut);
        
        uint256 currentPrice = (state.virtualUsdcReserve * 1e18) / state.virtualTokenReserve;
        emit TokensBought(token, msg.sender, usdcIn, tokenOut, currentPrice, fee);
        
        if (state.realUsdcAccumulated >= state.tokenGraduationThreshold) {
            _graduate(token, state);
        }
    }
    
    function sellTokens(address token, uint256 tokenIn, uint256 minUsdcOut) external nonReentrant {
        if (!isArcPumpToken[token]) revert NotArcPumpToken();
        if (tokenIn == 0) revert ZeroAmount();
        
        CurveState storage state = curveStates[token];
        if (state.graduated) revert AlreadyGraduated();
        if (state.pendingDexPool) revert AwaitingDexPool();
        
        uint256 usdcGross = (state.virtualUsdcReserve * tokenIn) / (state.virtualTokenReserve + tokenIn);
        uint256 fee = (usdcGross * PROTOCOL_FEE_BPS) / 10000;
        uint256 usdcOut = usdcGross - fee;
        
        accumulatedProtocolFees += fee;
        
        if (usdcOut < minUsdcOut) revert SlippageExceeded();
        if (usdcOut > state.realUsdcAccumulated) revert InsufficientReserve();
        
        state.virtualUsdcReserve -= usdcGross;
        state.virtualTokenReserve += tokenIn;
        state.realUsdcAccumulated -= usdcGross;
        state.tokensSold -= tokenIn;
        
        ArcMemecoin(token).burn(msg.sender, tokenIn);
        
        usdc.safeTransfer(msg.sender, usdcOut);
        
        uint256 currentPrice = (state.virtualUsdcReserve * 1e18) / state.virtualTokenReserve;
        emit TokensSold(token, msg.sender, tokenIn, usdcOut, currentPrice, fee);
    }
    
    function _graduate(address token, CurveState storage state) internal {
        if (dexRouter == address(0)) {
            state.pendingDexPool = true;
            emit TokenReadyForGraduation(token, state.realUsdcAccumulated, block.timestamp);
        } else {
            state.graduated = true;
            
            uint256 usdcToMigrate = state.realUsdcAccumulated;
            uint256 tokensToMigrate = INITIAL_VIRTUAL_TOKEN_RESERVE - state.tokensSold;
            
            uint256 creatorReward = (usdcToMigrate * 500) / 10000; // 5%
            usdcToMigrate -= creatorReward;
            address creator = ArcMemecoin(token).creator();
            usdc.safeTransfer(creator, creatorReward);
            emit CreatorRewarded(token, creator, creatorReward);
            
            ArcMemecoin(token).mint(address(this), tokensToMigrate);
            
            usdc.forceApprove(dexRouter, usdcToMigrate);
            IERC20(token).forceApprove(dexRouter, tokensToMigrate);
            
            address pool = IArcDEX(dexRouter).createPoolAndLock(token, usdcToMigrate, tokensToMigrate);
            emit TokenGraduated(token, pool, usdcToMigrate, tokensToMigrate);
        }
    }
    
    function graduate(address token) external nonReentrant {
        if (!isArcPumpToken[token]) revert NotArcPumpToken();
        CurveState storage state = curveStates[token];
        
        if (state.graduated) revert AlreadyGraduated();
        if (state.pendingDexPool) revert AlreadyPending();
        if (state.realUsdcAccumulated < state.tokenGraduationThreshold) revert ThresholdNotReached();
        
        _graduate(token, state);
    }
    
    function finalizePendingGraduation(address token) external nonReentrant {
        if (!isArcPumpToken[token]) revert NotArcPumpToken();
        CurveState storage state = curveStates[token];
        
        if (!state.pendingDexPool) revert NotPending();
        if (dexRouter == address(0)) revert ZeroAddress();
        
        state.pendingDexPool = false;
        state.graduated = true;
        
        uint256 usdcToMigrate = state.realUsdcAccumulated;
        uint256 tokensToMigrate = INITIAL_VIRTUAL_TOKEN_RESERVE - state.tokensSold;
        
        uint256 creatorReward = (usdcToMigrate * 500) / 10000; // 5%
        usdcToMigrate -= creatorReward;
        address creator = ArcMemecoin(token).creator();
        usdc.safeTransfer(creator, creatorReward);
        emit CreatorRewarded(token, creator, creatorReward);
        
        ArcMemecoin(token).mint(address(this), tokensToMigrate);
        
        usdc.forceApprove(dexRouter, usdcToMigrate);
        IERC20(token).forceApprove(dexRouter, tokensToMigrate);
        
        address pool = IArcDEX(dexRouter).createPoolAndLock(token, usdcToMigrate, tokensToMigrate);
        emit TokenGraduated(token, pool, usdcToMigrate, tokensToMigrate);
    }
    
    function withdrawFees(address to) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 amount = accumulatedProtocolFees;
        accumulatedProtocolFees = 0;
        
        if (amount > 0) {
            usdc.safeTransfer(to, amount);
        }
    }
    
    function getBuyQuote(address token, uint256 usdcIn) external view returns (uint256 tokenOut, uint256 fee) {
        CurveState memory state = curveStates[token];
        fee = (usdcIn * PROTOCOL_FEE_BPS) / 10000;
        uint256 usdcNet = usdcIn - fee;
        tokenOut = (state.virtualTokenReserve * usdcNet) / (state.virtualUsdcReserve + usdcNet);
    }
    
    function getSellQuote(address token, uint256 tokenIn) external view returns (uint256 usdcOut, uint256 fee) {
        CurveState memory state = curveStates[token];
        uint256 usdcGross = (state.virtualUsdcReserve * tokenIn) / (state.virtualTokenReserve + tokenIn);
        fee = (usdcGross * PROTOCOL_FEE_BPS) / 10000;
        usdcOut = usdcGross - fee;
    }
    
    function getGraduationProgress(address token) external view returns (uint256) {
        CurveState memory state = curveStates[token];
        if (state.graduated || state.pendingDexPool) return 10000;
        if (state.tokenGraduationThreshold == 0) return 0;
        return (state.realUsdcAccumulated * 10000) / state.tokenGraduationThreshold;
    }
    
    function getCurveState(address token) external view returns (CurveState memory) {
        return curveStates[token];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getCreatorTokens(address _creator) external view returns (address[] memory) {
        return creatorTokens[_creator];
    }
}
