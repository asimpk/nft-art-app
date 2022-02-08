import React, { useState, useEffect } from 'react';
import ArtCard from '../art/ArtCard';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';

import { nftaddress, nftmarketaddress } from '../../config';

import NFT from '../../artifacts/src/contracts/NFT.sol/NFT.json';
import NFTMarket from '../../artifacts/src/contracts/Market.sol/NFTMarket.json';

const UserArts = () => {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  useEffect(() => {
    loadNFTs();
  }, []);
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: true
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const data = await marketContract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState('loaded');
  }

  const handleBuyNft = () => {};

  return (
    <div className="market">
      <div className="market__header" />
      <div className="market__content">
        {nfts?.map(nft => {
          return <ArtCard nft={nft} handleBuyNft={handleBuyNft} />;
        })}
      </div>
    </div>
  );
};
export default UserArts;
