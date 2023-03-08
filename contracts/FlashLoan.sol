// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import "hardhat/console.sol";

contract AaveFlashloan is FlashLoanReceiverBase {
    using SafeERC20 for IERC20;
    
    constructor(IPoolAddressesProvider provider) FlashLoanReceiverBase(provider) {}

    function aaveFlashloan(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata interestRateModes) external {
        for (uint i; i < assets.length;) {
            uint fee = (amounts[i] * 5) / 10000;
            
            IERC20(assets[i]).transferFrom(msg.sender, address(this), fee); // User should have approved the fee amount before calling aaveFlashloan() function
                unchecked{ ++i; }
            }

            IPool(address(POOL)).flashLoan(address(this), assets, amounts, interestRateModes, address(this), "0x", 0);
    }
  
   /**
   * @notice Executes an operation after receiving the flash-borrowed assets
   * @dev Ensure that the contract can return the debt + premium, e.g., has
   *      enough funds to repay and has approved the Pool to pull the total amount
   * @param assets The addresses of the flash-borrowed assets
   * @param amounts The amounts of the flash-borrowed assets
   * @param premiums The fee of each flash-borrowed asset
   */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address,
        bytes calldata
    ) external returns (bool) {
        require(assets.length == amounts.length && amounts.length == premiums.length, "Incorrect params");
        for (uint i; i < premiums.length;) {
            console.log("--------------");
            console.log("Borrowed asset: ", assets[i]);
            console.log("borrowed amount:", amounts[i]);
            console.log("flashloan fee: ", premiums[i]);
            IERC20(assets[i]).approve(address(POOL), amounts[i] + premiums[i]);
            unchecked{++i;}
        }
        return true;
    }
}