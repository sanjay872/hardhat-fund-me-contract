const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//do the test in development network
//cmd npx hardhat test
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          let sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              //deploy our fund me contract
              //using hardhat-deploy

              //to get all the accounts given in config
              // const accounts=await ethers.getSigners()
              // const accountZero=accounts[0]

              deployer = (await getNamedAccounts()).deployer
              //run all the deploy script that has the 'all' tag
              await deployments.fixture(["all"])
              //deploy the contract
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async () => {
              it("set the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async () => {
              it("fails if enough eth is not transfered", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't sent enough!!"
                  )
              })

              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("adds funders to funders array", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async () => {
                  //Arrange
                  const startingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //getting gasUsed and effectiveGasprice to find gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundBalance, 0)
                  assert.equal(
                      startingFundBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw with multiple funders", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 4; i++) {
                      let contract = await ethers.getContract(
                          "FundMe",
                          accounts[i]
                      )
                      await contract.fund({ value: sendValue })
                  }
                  const startingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundBalance, 0)
                  assert.equal(
                      startingFundBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //check if the funder is zero
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 4; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("only allows owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  const fundMeByUser = await ethers.getContract("FundMe", user)
                  try {
                      await fundMeByUser.withdraw()
                  } catch (error) {
                      const res =
                          error.message.search("FundMe__notOwner()") >= 0
                      assert(res, `Expected throw, got ${error}`)
                      return
                  }
                  assert.fail("Expected throw not received")
              })

              it("withdraw ETH from a single founder using cheaperWithDraw", async () => {
                  //Arrange
                  const startingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.cheaperWithDraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //getting gasUsed and effectiveGasprice to find gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundBalance, 0)
                  assert.equal(
                      startingFundBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to cheaper withdraw with multiple funders", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 4; i++) {
                      let contract = await ethers.getContract(
                          "FundMe",
                          accounts[i]
                      )
                      await contract.fund({ value: sendValue })
                  }
                  const startingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithDraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundBalance, 0)
                  assert.equal(
                      startingFundBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //check if the funder is zero
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 4; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
