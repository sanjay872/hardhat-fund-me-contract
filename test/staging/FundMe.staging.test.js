const { assert } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChain } = require("../../helper-hardhat-config")

//do the testing in testing network
//cmd npx hardhat test --network rinkeby
developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows user to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withDraw()
              const endingFundBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingFundBalance.toString(), "0")
          })
      })
