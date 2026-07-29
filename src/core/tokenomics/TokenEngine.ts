import { MemoryEngine } from "../memory/MemoryEngine";

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  network: 'ethereum' | 'binance' | 'polygon' | 'solana' | 'tron' | 'custom';
  features: ('mintable' | 'burnable' | 'pausable' | 'snapshot' | 'governance')[];
  taxRate?: number;
  marketingWallet?: string;
  liquidityPercent?: number;
}

export interface TokenDeployment {
  token: TokenConfig;
  contractAddress: string;
  deployer: string;
  timestamp: number;
  network: string;
  explorer: string;
  status: 'simulated' | 'deployed';
}

export interface TokenomicsModel {
  name: string;
  description: string;
  totalSupply: number;
  distribution: {
    purpose: string;
    percent: number;
    lockupMonths?: number
  }[];
  inflationRate: number;
  deflationMechanism: string;
}

const NETWORK_EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  binance: 'https://bscscan.com/address/',
  polygon: 'https://polygonscan.com/address/',
  solana: 'https://solscan.io/account/',
  tron: 'https://tronscan.org/#/contract/',
  custom: 'https://explorer.custom.network/address/'
};

export class TokenEngine {
  private memoryEngine: MemoryEngine;
  private deployments: TokenDeployment[] = [];

  constructor(memoryEngine: MemoryEngine) {
    this.memoryEngine = memoryEngine;
  }

  generateToken(name: string, symbol: string, options?: Partial<TokenConfig>): TokenConfig {
    const token: TokenConfig = {
      name,
      symbol: symbol.toUpperCase(),
      totalSupply: options?.totalSupply ?? 1000000000,
      decimals: options?.decimals ?? 18,
      network: options?.network ?? 'ethereum',
      features: options?.features ?? ['mintable', 'burnable'],
      taxRate: options?.taxRate,
      marketingWallet: options?.marketingWallet,
      liquidityPercent: options?.liquidityPercent
    };
    return token;
  }

  createTokenomics(name: string, description: string, totalSupply: number): TokenomicsModel {
    return {
      name,
      description,
      totalSupply,
      distribution: [
        { purpose: 'Team', percent: 10, lockupMonths: 24 },
        { purpose: 'Marketing', percent: 15 },
        { purpose: 'Liquidity', percent: 20 },
        { purpose: 'Development', percent: 10 },
        { purpose: 'Staking Rewards', percent: 25 },
        { purpose: 'Community', percent: 20 }
      ],
      inflationRate: 2,
      deflationMechanism: 'Token burning on each transaction (1% per tx)'
    };
  }

  async deployToken(config: TokenConfig): Promise<TokenDeployment> {
    const address = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const deployment: TokenDeployment = {
      token: config,
      contractAddress: address,
      deployer: 'TrinnitySystem',
      timestamp: Date.now(),
      network: config.network,
      explorer: NETWORK_EXPLORERS[config.network] + address,
      status: 'simulated'
    };

    this.deployments.push(deployment);

    this.memoryEngine.addKnowledge(
      `Token deployed: ${config.name} (${config.symbol})`,
      'TOKEN_DEPLOYMENTS',
      `Token ${config.name} (${config.symbol}) deployed on ${config.network} with address ${address}. Supply: ${config.totalSupply}. Features: ${config.features.join(', ')}.`,
      ['token', 'deployment', config.symbol.toLowerCase(), config.network]
    );

    return deployment;
  }

  generateContractCode(token: TokenConfig): string {
    const features = token.features;
    const hasMintable = features.includes('mintable');
    const hasBurnable = features.includes('burnable');
    const hasPausable = features.includes('pausable');
    const hasGovernance = features.includes('governance');
    const hasSnapshot = features.includes('snapshot');
    const hasTax = token.taxRate !== undefined && token.taxRate > 0;

    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
${hasPausable ? 'import "@openzeppelin/contracts/security/Pausable.sol";' : ''}
${hasSnapshot ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";' : ''}
${hasGovernance ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";' : ''}

contract ${token.name.replace(/\s+/g, '')} is ERC20, Ownable${hasPausable ? ', Pausable' : ''}${hasSnapshot ? ', ERC20Snapshot' : ''}${hasGovernance ? ', ERC20Votes' : ''} {
    uint256 public constant TOTAL_SUPPLY = ${token.totalSupply} * 10 ** ${token.decimals};
    uint8 private _decimals = ${token.decimals};
    ${hasTax ? `uint256 public taxRate = ${token.taxRate};` : ''}
    ${hasTax && token.marketingWallet ? `address public marketingWallet = ${token.marketingWallet};` : ''}
    ${hasTax ? 'uint256 public constant TAX_DENOMINATOR = 10000;' : ''}

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    ${hasTax ? 'event TaxCollected(address indexed from, address indexed marketing, uint256 amount);' : ''}

    constructor() ERC20("${token.name}", "${token.symbol}") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    ${hasMintable ? `
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }` : ''}

    ${hasBurnable ? `
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }` : ''}

    ${hasPausable ? `
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }` : ''}

    ${hasSnapshot ? `
    function snapshot() external onlyOwner {
        _snapshot();
    }` : ''}

    ${hasTax ? `
    function _transfer(address sender, address recipient, uint256 amount) internal virtual override {
        if (taxRate > 0 && marketingWallet != address(0)) {
            uint256 taxAmount = (amount * taxRate) / TAX_DENOMINATOR;
            uint256 transferAmount = amount - taxAmount;
            super._transfer(sender, marketingWallet, taxAmount);
            emit TaxCollected(sender, marketingWallet, taxAmount);
            super._transfer(sender, recipient, transferAmount);
        } else {
            super._transfer(sender, recipient, amount);
        }
    }` : ''}

    ${hasGovernance ? `
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }` : ''}
}
`;
  }

  generateStakingContract(tokenSymbol: string): string {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ${tokenSymbol}Staking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
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
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18 / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        return (stakes[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender] >= amount, "Insufficient staked balance");
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }
}
`;
  }

  generateGovernanceContract(tokenSymbol: string): string {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${tokenSymbol}Governance is Ownable {
    IERC20 public governanceToken;

    struct Proposal {
        uint256 id;
        string description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        mapping(address => bool) voters;
        mapping(address => uint256) votes;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public votingPeriod = 7 days;
    uint256 public quorum = 1000000 * 1e18;

    event ProposalCreated(uint256 indexed id, string description, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    constructor(address _governanceToken) {
        governanceToken = IERC20(_governanceToken);
    }

    function createProposal(string calldata description) external {
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.description = description;
        p.proposer = msg.sender;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        emit ProposalCreated(proposalCount, description, msg.sender);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.startTime, "Voting not started");
        require(block.timestamp <= p.endTime, "Voting ended");
        require(!p.voters[msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        p.voters[msg.sender] = true;
        p.votes[msg.sender] = weight;

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.endTime, "Voting still active");
        require(!p.executed, "Already executed");
        require(!p.canceled, "Proposal canceled");
        require(p.forVotes + p.againstVotes >= quorum, "Quorum not reached");
        require(p.forVotes > p.againstVotes, "Proposal rejected");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }

    function setQuorum(uint256 _quorum) external onlyOwner {
        quorum = _quorum;
    }
}
`;
  }

  getDeployments(): TokenDeployment[] {
    return this.deployments;
  }

  generateTokenArt(token: TokenConfig): { logo: string; banner: string; color: string } {
    const colors: Record<string, string> = {
      ethereum: '#627EEA',
      binance: '#F0B90B',
      polygon: '#8247E5',
      solana: '#9945FF',
      tron: '#FF060A',
      custom: '#00D4AA'
    };

    return {
      logo: `https://ui-avatars.com/api/?name=${token.symbol}&background=${colors[token.network].replace('#', '')}&color=fff&size=256`,
      banner: `https://placehold.co/1200x400/${colors[token.network].replace('#', '')}/ffffff?text=${token.symbol}`,
      color: colors[token.network]
    };
  }
}
