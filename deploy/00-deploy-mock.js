const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], //it need two arguments are decimal and initialAnswer refer the MockV3 code in github
        })
        log("MOCKS DEPLOYED!!!!")
        log("-------------------------------------------------")
    }
}

//to identify the deploy script and run only those script
//cmd npx hardhat deploy --tags mocks so it will run only the script which are tagged with mocks
module.exports.tags = ["all", "mocks"]
