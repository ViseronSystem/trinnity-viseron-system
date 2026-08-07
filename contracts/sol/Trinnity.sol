// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// TRINNITY (TRIN) — Ethereum & BSC · Viseron Cosmos
// Memecoin interplanetária do batallón. Missão: levar as 5000+ mentes
// do TVS às estrelas. Supply tipo Dogelon ELON (massa cósmica),
// deflacionária: 2% queimado em cada transferência.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ============================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Trinnity is ERC20, ERC20Burnable, Ownable {
    // 420.690.000 TRIN (420,69M) — supply otimizado para gerar liquidez
    uint256 public constant TOTAL_SUPPLY = 420_690_000e18;
    uint256 public constant MAX_TX = 2_103_450e18; // anti-bot: ~0.5% por transação

    uint256 public constant BURN_RATE = 200; // 2% queimado por transferência
    uint256 public constant RATE_DENOM = 10000;

    mapping(address => bool) public isExcludedFromFee;
    address public launchPool;
    uint256 public launchedAt; // 0 = pré-lançamento (transferências bloqueadas)

    event PoolSet(address indexed pool);
    event Launched(uint256 timestamp);

    constructor() ERC20("Trinnity", "TRIN") Ownable(msg.sender) {
        isExcludedFromFee[address(this)] = true;
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function setLaunchPool(address pool) external onlyOwner {
        require(launchPool == address(0), "Pool already set");
        require(pool != address(0), "Zero");
        launchPool = pool;
        isExcludedFromFee[pool] = true;
        emit PoolSet(pool);
    }

    // Ativa o mercado (chamado quando há liquidez). Antes disso ninguém transfere.
    function launch() external onlyOwner {
        require(launchPool != address(0), "Pool not set");
        require(launchedAt == 0, "Already launched");
        launchedAt = block.timestamp;
        emit Launched(block.timestamp);
    }

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        if (from != address(0) && to != address(0)) {
            if (launchedAt == 0) {
                // Pré-lançamento: só o owner pode mover (setup de liquidez).
                require(msg.sender == owner(), "TRIN: not launched");
            }
            if (!isExcludedFromFee[from] && !isExcludedFromFee[to]) {
                require(amount <= MAX_TX, "TRIN: max tx (anti-bot)");
            }
        }

        uint256 burnAmount;
        if (from != address(0) && to != address(0) && !isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            burnAmount = (amount * BURN_RATE) / RATE_DENOM;
        }

        uint256 netAmount = amount - burnAmount;
        if (netAmount > 0) super._update(from, to, netAmount);
        if (burnAmount > 0) super._update(from, address(0), burnAmount);
    }

    function setExcluded(address account, bool excluded) external onlyOwner {
        isExcludedFromFee[account] = excluded;
    }
}
