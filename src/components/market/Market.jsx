import React, { useState, useEffect } from 'react';
import ArtCard from '../art/ArtCard';
import axios from 'axios';
import { ethers } from 'ethers';

import { nftaddress, nftmarketaddress } from '../../config';

import NFT from '../../artifacts/src/contracts/NFT.sol/NFT.json';
import NFTMarket from '../../artifacts/src/contracts/Market.sol/NFTMarket.json';

const Market = () => {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      provider
    );
    const data = await marketContract.fetchMarketItems();

    /*
     *  map over items returned from smart contract and format
     *  them as well as fetch their token metadata
     */
    const items = await Promise.all(
      data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.highestBid.toString(), 'ether');
        let sellerName =  ethers.utils.parseBytes32String(i.sellerName);
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: sellerName,
          owner: i.owner,
          auctionEndTime: i.auctionEndTime.toString() * 1000,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description
        };
        console.log('Itemsss', item);
        return item;
      })
    );
    setNfts(items);
    setLoadingState('loaded');
  };

  return (
    <div className="market">
      <div className="market__header" />
      <div className="market__content">
        {nfts?.map((nft, index) => {
          return <ArtCard nft={nft} />;
        })}
      </div>
    </div>
  );
};
export default Market;
