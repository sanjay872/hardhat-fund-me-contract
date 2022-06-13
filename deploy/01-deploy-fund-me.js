// function deployFunction(hre) {
//     console.log("HI")
// }

// module.exports.default = deployFunction

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/Verify")

//arguments from hardhat runtime environment
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //if chainId is X use address Y
    //if chainId is Z use address A
    let ethUsdPriceFeedAddress

    //when we are using localhost we need to mock our contact
    //if the contact doesn't exist, we deploy a minimal version
    //for our local testing

    //if we are in local or hardhat instance
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        //if we are in test or other networks
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]

    //deploying fundme
    const fundMe = await deploy("FundMe", {
        from: deployer, // our account address
        args: args, //passed to constructor
        log: true, //show logs
        //the no of block its need to wait
        //if blockConfimation is not given, it will be 1
        waitConfirmation: network.config.blockConfirmation || 1,
    })

    //To verify the contract
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [], args)
    }

    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
