import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {USDC_ADDR, USDC_DAI_WHALE, AAVE_POOL_ADDRESS_PROVIDER} from "./config.js";
import IERC20 from './IERC20.json';

describe("FlashLoan Test", function () {
  const DECIMALS = 6;
  const BORROW_AMOUNT = ethers.BigNumber.from("1000000").mul(ethers.BigNumber.from("10").pow(DECIMALS)); // 1kk USDC
  const FEE_AMOUNT = BORROW_AMOUNT.mul(5).div(10000) //0.05% = 500 USDC

  async function deployFixture() {
    const usdc = await ethers.getContractAt(IERC20, USDC_ADDR);
    const FlashLoanSimple = await ethers.getContractFactory("AaveFlashloan");
    const flashloan = await FlashLoanSimple.deploy(AAVE_POOL_ADDRESS_PROVIDER);
    await flashloan.deployed();

    await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [USDC_DAI_WHALE],
    });

    const whale = await ethers.getSigner(USDC_DAI_WHALE);
    return {usdc, flashloan, whale}
  }

  it("Should borrow 1kk USDC using a simple Aave Flashloan", async function () {
    const{usdc, flashloan, whale} = await loadFixture(deployFixture);    
    await usdc.connect(whale).approve(flashloan.address, FEE_AMOUNT);
    expect(await usdc.allowance(whale.address, flashloan.address)).to.eq(FEE_AMOUNT);
    await flashloan.connect(whale).aaveFlashloanSimple(USDC_ADDR, BORROW_AMOUNT);
  });

  it("Should borrow 1kk USDC 1kk DAI using an Aave Flashloan", async function () {
    



  })
});
