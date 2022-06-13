// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        //convert int to uint
        return uint256(price * 1e10); //price is 10^8 but we need 10^18
    }

    //get version of price feed
    // function getVersion(AggregatorV3Interface priceFeed)
    //     internal
    //     view
    //     returns (uint256)
    // {
    //     //ABI
    //     //Address
    //     // AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //     //     0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    //     // );
    //     return priceFeed.version();
    // }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18; //multipling add 10^18 zeros to the answer so we need to divide it by 1e18
        return ethAmountInUsd;
    }
}
