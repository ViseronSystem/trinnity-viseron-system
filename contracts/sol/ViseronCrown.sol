// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// VISERON CROWN (VSR) — Ethereum & BSC
// Moeda do batallón TVS · Prueba de Mandato (PoM) · Viseron Cosmos
// Utilitária: governança (ERC20Votes) + staking + recompensas AIOX.
// Deflacionária: 1% por transferência é queimado + 1% caixa (treasury).
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ============================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ViseronCrown is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant TOTAL_SUPPLY = 300_000_000e18; // 300M VSR
    uint256 public constant MAX_WALLET = 9_000_000e18;     // anti-whale 3% da oferta

    // Proporções 1:10000 (1% queima + 1% segurança por transferência)
    uint256 public constant BURN_RATE = 100;
    uint256 public constant SECURITY_RATE = 100;
    uint256 public constant RATE_DENOM = 10000;

    address public treasury;
    mapping(address => bool) public isExcludedFromFee;

    event TreasuryUpdated(address indexed treasury);
    event Excluded(address indexed account, bool excluded);

    constructor(address _treasury)
        ERC20("Viseron Crown", "VSR")
        ERC20Permit("Viseron Crown")
        Ownable(msg.sender)
    {
        require(_treasury != address(0), "Treasury zero");
        treasury = _treasury;
        isExcludedFromFee[address(this)] = true;
        isExcludedFromFee[msg.sender] = true; // owner cuida do supply inicial e liquidez
        _delegate(msg.sender, msg.sender);
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        uint256 burnAmount;
        uint256 securityAmount;

        if (from != address(0) && to != address(0) && !isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            burnAmount = (amount * BURN_RATE) / RATE_DENOM;
            securityAmount = (amount * SECURITY_RATE) / RATE_DENOM;
        }

        uint256 netAmount = amount - burnAmount - securityAmount;
        if (netAmount > 0) {
            if (to != address(0) && !isExcludedFromFee[to] && balanceOf(to) + netAmount > MAX_WALLET) {
                revert("VSR: max wallet (anti-whale)");
            }
            super._update(from, to, netAmount);
        }
        if (burnAmount > 0) super._update(from, address(0), burnAmount);
        if (securityAmount > 0) super._update(from, treasury, securityAmount);
    }

    function nonces(address owner)
        public
        view
        virtual
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setExcluded(address account, bool excluded) external onlyOwner {
        isExcludedFromFee[account] = excluded;
        emit Excluded(account, excluded);
    }

    // ERC20Votes (governança) — relógio por timestamp para qualquer EVM chain
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
