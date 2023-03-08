import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { aave } from "../typechain-types/factories";
import {USDC_ADDR, DAI_ADDR, AAVE_ADDR, USDC_DAI_WHALE, AAVE_WHALE, AAVE_POOL_ADDRESS_PROVIDER} from "./config.js";
import IERC20 from './IERC20.json';

describe("FlashLoan Test", function () {
  const BORROW_AMOUNT_USDC = ethers.BigNumber.from("1000000").mul(ethers.BigNumber.from("10").pow(6)); // 1kk USDC
  const FEE_AMOUNT_USDC = BORROW_AMOUNT_USDC.mul(5).div(10000) //0.05% = 500 USDC

  const BORROW_AMOUNT_DAI = ethers.BigNumber.from("1000000").mul(ethers.BigNumber.from("10").pow(18)); // 1kk DAI
  const FEE_AMOUNT_DAI = BORROW_AMOUNT_DAI.mul(5).div(10000);
  
  const BORROW_AMOUNT_AAVE = ethers.BigNumber.from("1000").mul(ethers.BigNumber.from("10").pow(18)); // 1kk AAVE
  const FEE_AMOUNT_AAVE = BORROW_AMOUNT_AAVE.mul(5).div(10000);


  async function deployFixture() {
    const usdc = await ethers.getContractAt(IERC20, USDC_ADDR);
    const dai = await ethers.getContractAt(IERC20, DAI_ADDR);
    const aave = await ethers.getContractAt(IERC20, AAVE_ADDR);
    const FlashLoanSimple = await ethers.getContractFactory("AaveFlashloanSimple");
    const flashloanSimple = await FlashLoanSimple.deploy(AAVE_POOL_ADDRESS_PROVIDER);
    await flashloanSimple.deployed();

    const FlashLoan = await ethers.getContractFactory("AaveFlashloan");
    const flashloan = await FlashLoan.deploy(AAVE_POOL_ADDRESS_PROVIDER);
    await flashloan.deployed();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [AAVE_WHALE],
    });

    const aave_whale = await ethers.getSigner(AAVE_WHALE); 

    await aave.connect(aave_whale).transfer(USDC_DAI_WHALE, ethers.utils.parseEther("1500"));
    
    await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [USDC_DAI_WHALE],
    });

    const usdc_dai_aave_whale = await ethers.getSigner(USDC_DAI_WHALE);
    return {usdc, dai, aave, flashloan, flashloanSimple, usdc_dai_aave_whale}
  }

  it("Should borrow 1kk USDC using a simple Aave Flashloan", async function () {
    const{usdc, flashloanSimple, usdc_dai_aave_whale} = await loadFixture(deployFixture);    
    await usdc.connect(usdc_dai_aave_whale).approve(flashloanSimple.address, FEE_AMOUNT_USDC);
    expect(await usdc.allowance(usdc_dai_aave_whale.address, flashloanSimple.address)).to.eq(FEE_AMOUNT_USDC);
    await flashloanSimple.connect(usdc_dai_aave_whale).aaveFlashloanSimple(USDC_ADDR, BORROW_AMOUNT_USDC);
  });

  it("Should borrow 1kk USDC 1kk DAI and 1k AAVE using an Aave Flashloan", async function () {
    const{usdc, dai, aave, flashloan, usdc_dai_aave_whale} = await loadFixture(deployFixture);

    await usdc.connect(usdc_dai_aave_whale).approve(flashloan.address, FEE_AMOUNT_USDC);
    await dai.connect(usdc_dai_aave_whale).approve(flashloan.address, FEE_AMOUNT_DAI);
    await aave.connect(usdc_dai_aave_whale).approve(flashloan.address, FEE_AMOUNT_AAVE); // 5* 1000e18/ 10000 = 0.5 * 10e18

    expect(await usdc.allowance(usdc_dai_aave_whale.address, flashloan.address)).to.eq(FEE_AMOUNT_USDC);
    expect(await dai.allowance(usdc_dai_aave_whale.address, flashloan.address)).to.eq(FEE_AMOUNT_DAI);
    expect(await aave.allowance(usdc_dai_aave_whale.address, flashloan.address)).to.eq(FEE_AMOUNT_AAVE); // 5* 1000e18/ 10000 = 0.5 * 10e18

    const assets = [USDC_ADDR, DAI_ADDR, AAVE_ADDR];
    const amounts = [BORROW_AMOUNT_USDC, BORROW_AMOUNT_DAI, BORROW_AMOUNT_AAVE];
    const interestRateModes = [ethers.constants.Zero, ethers.constants.Zero, ethers.constants.Zero];
    await flashloan.connect(usdc_dai_aave_whale).aaveFlashloan(assets, amounts, interestRateModes);
  })
});
