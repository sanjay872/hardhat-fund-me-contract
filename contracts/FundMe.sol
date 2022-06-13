// SPDX-License-Identifier: MIT

//1) pragma
pragma solidity ^0.8.0;

//2) imports
import "./PriceConverter.sol";

//3) errors
error FundMe__notOwner();

//4) Interfaces, Libaries, Contracts

/**
    @title A contract for crowd funding
    @author sanjay
    @notice This contract is to demo a funding contract
    @dev This implements price feed as our library 
*/
contract FundMe {
    //type declaration
    using PriceConverter for uint256;

    //state variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    //constants
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18; //1 * 10^18

    AggregatorV3Interface private s_priceFeed;

    //modifiers
    modifier onlyOwner() {
        //require(msg.sender == owner,"Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    /**Function order
        contructor
        receive
        fallback
        external
        public
        Internal 
        Private
        View/pure
    */

    //constructor
    constructor(address _priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    //fallbacks

    // if someone sent fund without call fund function
    // receive() external payable {
    //     fund();
    // }

    // //if someone call function that doesn't exist
    // fallback() external payable {
    //     fund();
    // }

    /**
        @notice This function funds this contract
        @dev This implements price feed as our library
     */
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't sent enough!!"
        ); // 1 eth18 = 10^18
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    /**
        @notice this function is for withdraw used by owner
        @dev this function uses modifier
     */
    function withdraw() public onlyOwner {
        //reset mapping
        for (uint256 fundIndex = 0; fundIndex < s_funders.length; fundIndex++) {
            address funder = s_funders[fundIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset the array
        s_funders = new address[](0);

        //transfer
        //send
        //call

        //msg.sender is of type address
        //payable(msg.sender)= payable address
        // payable(msg.sender.transfer(address(this).balance))

        // //send
        // bool sendSuccess=payable(msg.sender).send(address(this).balance);
        // returns(sendSuccess,"Send failed");

        //call
        //u can call any method without using ABI
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function cheaperWithDraw() public payable onlyOwner {
        //making copy of funder and updating it is cheaper
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call Failed");
    }

    //Getters

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
