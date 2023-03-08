// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "hardhat/console.sol";

contract AaveFlashloanSimple is FlashLoanSimpleReceiverBase {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    constructor(IPoolAddressesProvider provider)
        FlashLoanSimpleReceiverBase(provider)
    {}

    function aaveFlashloanSimple(address loanToken, uint256 loanAmount) external {
        uint fee = ((loanAmount*5)/10000);
        IERC20(loanToken).transferFrom(msg.sender, address(this), fee); // User should have approved the fee amount before calling aaveFlashloan() function
        IPool(address(POOL)).flashLoanSimple(
            address(this),
            loanToken,
            loanAmount,
            "0x",
            0
        );
    }

  /**
   * @notice Executes an operation after receiving the flash-borrowed asset
   * @dev Ensure that the contract can return the debt + premium, e.g., has
   *      enough funds to repay and has approved the Pool to pull the total amount
   * @param asset The address of the flash-borrowed asset
   * @param amount The amount of the flash-borrowed asset
   * @param premium The fee of the flash-borrowed asset
   * @param initiator The address of the flashloan initiator
   * @param params The byte-encoded params passed when initiating the flashloan
   * @return True if the execution of the operation succeeds, false otherwise
   */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium, // fee
        address initiator, // initiator
        bytes memory params
    ) public override returns (bool) {
        require(
            amount <= IERC20(asset).balanceOf(address(this)),
            "Invalid balance for the contract"
        );
        console.log("borrowed amount:", amount);
        console.log("flashloan fee: ", premium);

        IERC20(asset).approve(address(POOL), amount.add(premium));

        return true;
    }
}
