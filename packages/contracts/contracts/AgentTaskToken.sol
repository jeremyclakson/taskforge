// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentTaskToken
/// @notice Platform token for incentives, rewards, and gasless transactions
/// @dev ERC20 with permit, pause, and mint functionality
contract AgentTaskToken is
    ERC20,
    ERC20Permit,
    ERC20PresetMinterPauser
{
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant GENESIS_SUPPLY = 200_000_000 * 10**18; // 200M to ecosystem
    uint256 public constant COMMUNITY_REWARD_SUPPLY = 300_000_000 * 10**18; // 300M to rewards

    error MaxSupplyExceeded();

    constructor()
        ERC20("AgentTask")
        ERC20Permit("AgentTask")
        ERC20PresetMinterPauser(msg.sender)
    {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override virtual {
        super._afterTokenTransfer(from, to, amount);
        // Future hook for vesting or restrictions
    }

    /// @notice Initial genesis distribution
    function genesisDistribution(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlyOwner
    {
        uint256 totalMinted = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], amounts[i]);
            totalMinted += amounts[i];
        }

        if (totalMinted > GENESIS_SUPPLY) revert MaxSupplyExceeded();
    }

    /// @notice Mint community reward tokens
    function mintRewards(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlyOwner
    {
        uint256 totalSupply = this.totalSupply();
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 newSupply = totalSupply + amounts[i];
            if (newSupply > MAX_SUPPLY) revert MaxSupplyExceeded();
            mint(recipients[i], amounts[i]);
        }
    }

    /// @notice Pause token (emergency)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause token
    function unpause() external onlyOwner {
        _unpause();
    }
}
