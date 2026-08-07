// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// VISERON CROWN STAKING — Viseron Cosmos
// Stake VSR → recompensas TRIN (ou VSR). Com APR variável e
// cooldown de 7 dias (sem penalidade, só trava o claim).
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ============================================================

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ViseronCrownStaking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;   // VSR
    IERC20 public rewardToken;    // TRIN (ou VSR)

    uint256 public rewardRate;        // recompensas por segundo por 1e18 stake
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public cooldown = 7 days;

    uint256 public totalStaked;

    struct StakeInfo {
        uint256 amount;
        uint256 lastStakeTime;
    }

    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public lastClaimTime;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate)
        Ownable(msg.sender)
    {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored
            + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        return ((stakes[account].amount * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18)
            + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Stake > 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lastStakeTime = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Withdraw > 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        require(block.timestamp >= stakes[msg.sender].lastStakeTime + cooldown, "Cooldown active");
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            lastClaimTime[msg.sender] = block.timestamp;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
    }

    // Resgate de emergência (nunca remove o VSR staked dos utilizadores).
    function recoverRewards(address token, uint256 amount) external onlyOwner {
        if (token == address(stakingToken)) {
            require(stakingToken.balanceOf(address(this)) - amount >= totalStaked, "Protected stake");
        }
        IERC20(token).transfer(owner(), amount);
    }
}
