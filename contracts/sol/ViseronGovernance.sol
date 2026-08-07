// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// VISERON CROWN GOVERNANCE — Viseron Cosmos
// O batallón decide com VSR. Propostas, votação ponderada por
// votos delegados (ERC20Votes) e execução por multisig/owner.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ============================================================

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ViseronGovernance is Ownable {
    ERC20Votes public governanceToken; // VSR (ERC20Votes)

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bytes4 targetFunction;  // placeholder de execução on-chain
        address target;
        bytes callData;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    uint256 public votingPeriod = 7 days;
    uint256 public quorum = 7_500_000e18; // 2.5% da oferta (300M)

    event ProposalCreated(uint256 indexed id, string title, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = ERC20Votes(_governanceToken);
    }

    function createProposal(string calldata title, string calldata description)
        external
        returns (uint256 id)
    {
        require(governanceToken.getVotes(msg.sender) >= 1_000_000e18, "Need 1M VSR votes");
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.title = title;
        p.description = description;
        p.proposer = msg.sender;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        emit ProposalCreated(proposalCount, title, msg.sender);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.startTime && block.timestamp <= p.endTime, "Not voting window");
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 weight = governanceToken.getVotes(msg.sender);
        require(weight > 0, "No voting power");

        p.hasVoted[msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.endTime, "Voting still active");
        require(!p.executed && !p.canceled, "Already resolved");
        require(p.forVotes + p.againstVotes >= quorum, "Quorum not reached");
        require(p.forVotes > p.againstVotes, "Proposal rejected");

        p.executed = true;
        emit ProposalExecuted(proposalId);

        if (p.target != address(0) && p.callData.length > 0) {
            (bool ok, ) = p.target.call(p.callData);
            require(ok, "Execution failed");
        }
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
