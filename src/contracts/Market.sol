// contracts/Market.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.4.22 <0.9.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import 'hardhat/console.sol';

contract NFTMarket is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;
  Counters.Counter private _bidIds;

  address payable owner;
  uint256 listingPrice = 1 ether;

  mapping(uint256 => MarketItem) private idToMarketItem;
  mapping(address => mapping(uint256 => uint256)) private pendingReturns;
  mapping(uint256 => Activity) private bidActivities;

  constructor() {
    owner = payable(msg.sender);
  }

  struct Activity {
    uint256 bidId;
    address bidderAddress;
    bytes32 bidderName;
    uint256 bidValue;
    bool withDraw;
  }
  struct MarketItem {
    uint256 itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 auctionEndTime;
    address highestBidder;
    uint256 highestBid;
    bytes32 sellerName;
    bytes32 ownerName;
    uint256[] bidActivities;
    bool sold;
    bool ended;
  }

  event ActivityCreated(
    uint256 bidId,
    address bidderAddress,
    bytes32 bidderName,
    uint256 bidValue,
    bool withDraw

  );

  event MarketItemCreated(
    uint256 itemId,
    address indexed nftContract,
    uint256 tokenId,
    address seller,
    address owner,
    uint256 auctionEndTime,
    address highestBidder,
    uint256 highestBid,
    bytes32 sellerName,
    bytes32 ownerName,
    bool sold,
    bool ended
  );

  event HighestBidIncreased(
    address indexed bidder,
    uint256 indexed amount
  );
  event AuctionEnded(address indexed winner, uint256 indexed amount);

  /* Returns the listing price of the contract */
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }

  /* Places an item for sale on the marketplace */
  function createMarketItem(
    address nftContract,
    uint256 tokenId,
    uint256 highestBid,
    uint256 biddingTime,
    bytes32 sellerName
  ) public payable nonReentrant {
    require(highestBid > 0, 'Price must be at least 1 wei');
    require(msg.value == listingPrice, 'Price must be equal to listing price');

    _itemIds.increment();
    _bidIds.increment();
    uint256 itemId = _itemIds.current();
    uint256 bidId = _bidIds.current();
    MarketItem memory marketItem;

    marketItem.itemId = itemId;
    marketItem.nftContract = nftContract;
    marketItem.tokenId = tokenId;
    marketItem.seller = payable(msg.sender);
    marketItem.owner = payable(address(0));
    marketItem.auctionEndTime = block.timestamp + biddingTime;
    marketItem.highestBidder = msg.sender;
    marketItem.highestBid = highestBid;
    marketItem.sellerName = sellerName;
    marketItem.ownerName = '';
    marketItem.sold = false;
    marketItem.ended = false;
    idToMarketItem[itemId] = marketItem;
    idToMarketItem[itemId].bidActivities.push(bidId);

    pendingReturns[msg.sender][itemId] += highestBid;

    Activity memory act = Activity({
      bidId: bidId,
      bidderAddress: msg.sender,
      bidderName: sellerName,
      bidValue: highestBid,
      withDraw: true
    });
    bidActivities[bidId] = act;
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketItemCreated(
      itemId,
      nftContract,
      tokenId,
      msg.sender,
      address(0),
      block.timestamp + biddingTime,
      msg.sender,
      highestBid,
      sellerName,
      '',
      false,
      false
    );
    emit ActivityCreated(bidId, msg.sender, sellerName, highestBid, false);
  }

  /// Bid on the auction with the value sent
  /// together with this transaction.
  /// The value will only be refunded if the
  /// auction is not won.
  function bid(uint256 itemId, bytes32 bidderName) public payable {
    // No arguments are necessary, all
    // information is already part of
    // the transaction. The keyword payable
    // is required for the function to
    // be able to receive Ether.

    // Revert the call if the bidding
    // period is over.
    uint256 auctionEndTime = idToMarketItem[itemId].auctionEndTime;
    uint256 highestBid = idToMarketItem[itemId].highestBid;
    address highestBidder = idToMarketItem[itemId].highestBidder;

    if (block.timestamp > auctionEndTime)
      revert('The auction has already ended');
    // If the bid is not higher, send the
    // money back (the revert statement
    // will revert all changes in this
    // function execution including
    // it having received the money).
    if (msg.value <= highestBid) revert('There is already higher or equal bid');

    if (highestBid != 0) {
      // Sending back the money by simply using
      // highestBidder.send(highestBid) is a security risk
      // because it could execute an untrusted contract.
      // It is always safer to let the recipients
      // withdraw their money themselves.
      pendingReturns[highestBidder][itemId] += highestBid;
      // idToMarketItem[itemId].pendingReturns[highestBidder] += highestBid;
    }
    idToMarketItem[itemId].highestBidder = msg.sender;
    idToMarketItem[itemId].highestBid = msg.value;

    _bidIds.increment();
    uint256 bidId = _bidIds.current();
    idToMarketItem[itemId].bidActivities.push(bidId);

    Activity memory activity;
    activity.bidId = bidId;
    activity.bidderAddress = msg.sender;
    activity.bidderName = bidderName;
    activity.bidValue = msg.value;
    activity.withDraw = true;
    bidActivities[bidId] = activity;
    emit HighestBidIncreased(msg.sender, msg.value);
  }

  /// Withdraw a bid that was overbid.
  function withrawEligible(uint256 itemId) external returns (bool) {
    uint256 amount = pendingReturns[msg.sender][itemId];
    if (amount > 0) {
       return true;
    }
    return false;
  }
  function withdraw(uint256 itemId, uint256 bidId) external returns (bool) {
    uint256 amount = pendingReturns[msg.sender][itemId];
    if (amount > 0) {
      // It is important to set this to zero because the recipient
      // can call this function again as part of the receiving call
      // before `send` returns.
        pendingReturns[msg.sender][itemId] = 0;
        bidActivities[bidId].withDraw = false;

      if (!payable(msg.sender).send(amount)) {
        // No need to call throw here, just reset the amount owing
        pendingReturns[msg.sender][itemId] = amount;
        bidActivities[bidId].withDraw = true;
        return false;
      }
    }
    return true;
  }

  function auctionEnd(address nftContract, uint256 itemId)
    public
    payable
    nonReentrant
  {
    // It is a good guideline to structure functions that interact
    // with other contracts (i.e. they call functions or send Ether)
    // into three phases:
    // 1. checking conditions
    // 2. performing actions (potentially changing conditions)
    // 3. interacting with other contracts
    // If these phases are mixed up, the other contract could call
    // back into the current contract and modify the state or cause
    // effects (ether payout) to be performed multiple times.
    // If functions called internally include interaction with external
    // contracts, they also have to be considered interaction with
    // external contracts.

    uint256 auctionEndTime = idToMarketItem[itemId].auctionEndTime;
    uint256 highestBid = idToMarketItem[itemId].highestBid;
    address highestBidder = idToMarketItem[itemId].highestBidder;
    bool ended = idToMarketItem[itemId].ended;
    uint256 tokenId = idToMarketItem[itemId].tokenId;

    // 1. Conditions
    if (block.timestamp < auctionEndTime)
      revert('The Auction has not ended yet');
    if (ended) revert('The auctionEnded function has already been called');

    // 2. Effects
    idToMarketItem[itemId].ended = true;
    emit AuctionEnded(highestBidder, highestBid);

    // 3. Interaction
    idToMarketItem[itemId].seller.transfer(highestBid);

    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    idToMarketItem[itemId].owner = payable(msg.sender);
    idToMarketItem[itemId].sold = true;
    _itemsSold.increment();
    payable(owner).transfer(listingPrice);
  }

  /* Returns all unsold market items */
  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint256 itemCount = _itemIds.current();
    uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
    uint256 currentIndex = 0;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);
    for (uint256 i = 0; i < itemCount; i++) {
      if (idToMarketItem[i + 1].owner == address(0)) {
        uint256 currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  event testBidActs(
    uint256 indexed count,
    Activity[] indexed activities,
    Activity indexed activity
  );

  function fetchBidActivities(uint256 itemId)
    public
    view
    returns (Activity[] memory)
  {
    uint256 currentIndex = 0;
    uint256 actvitiesCount = idToMarketItem[itemId].bidActivities.length;

    Activity[] memory activities = new Activity[](actvitiesCount);

    for (uint256 i = 0; i < actvitiesCount; i++) {
      Activity storage currentActivity = bidActivities[
        idToMarketItem[itemId].bidActivities[i]
      ];
      activities[currentIndex] = currentActivity;
      currentIndex += 1;
    }
    return activities;
  }

  /* Returns only items that a user has purchased */
  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        uint256 currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  /* Returns only items a user has created */
  function fetchItemsCreated() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        uint256 currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }
}
