import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

import { nftmarketaddress } from '../../config';
import NFTMarket from '../../artifacts/src/contracts/Market.sol/NFTMarket.json';

const SingleArt = () => {
  const [bidActivities, setBidActivities] = useState([]);
  const location = useLocation();
  const { nft } = location.state;

  useEffect(() => {
    nft && getBiddingActivities();
  }, [nft]);

  const getBiddingActivities = async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    const data = await marketContract.fetchBidActivities(nft?.tokenId);
    const items = data.map(i => {
      let bidValue = ethers.utils.formatUnits(i.bidValue.toString(), 'ether');
      let item = {
        bidValue: bidValue,
        bidderAddress: i.bidderAddress,
        bidderName: ethers.utils.parseBytes32String(i.bidderName)
      };
      return item;
    });
    setBidActivities(items);
  };

  const handleBuyNft = async nft => {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    console.log('Account:', await signer.getAddress());
    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits('10', 'ether');
    const bidderName = ethers.utils.formatBytes32String('New Bidder');
    const transaction = await contract.bid(nft.tokenId, bidderName, {
      value: price
    });
    let tx = await transaction.wait();
    console.log('tx.events', tx.events);
    getBiddingActivities();
  };

  const checkWithdraw = async nft => {
    const provider = new ethers.providers.JsonRpcProvider();
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    const data = await contract.withrawEligible(nft?.tokenId);
    console.log('provider', data);
  };
  return (
    <div className="singleart">
      <div className="singleart__hero">
        <div className="hero_img">
          {nft?.image ? (
            <img src={nft?.image} />
          ) : (
            <img src="data:image/png;base64,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" />
          )}
        </div>
        <div className="hero_detail"></div>
      </div>
      <div className="singleart__detail">
        <div className="detail__section__left">
          <div className="detail__artowner">OWner</div>
          <div className="detail__heading">
            The Pretty Fantasy World of Mine
          </div>
          <div className="detail__description">
            Habitant sollicitudin faucibus cursus lectus pulvinar dolor non
            ultrices eget. Facilisi lobortis morbi fringilla urna amet sed ipsum
            vitae malesuada. Augue neque dui venenatis in sit sem a venenatis.
            Egestas purus sit nullam quis. Ornare magna rutrum tellus tellus
            porta massa. Lectus viverra amet velit consequat sit.
          </div>
        </div>
        <div className="detail__section__right">
          <div className="detail__bid">
            <div className="bid_heading">Bid Details</div>
            <div className="bid_current">Current Bid</div>
            <div className="bid_time">Auction Time</div>
            <div className="bid_action">
              <div className="artcard__status--bid">
                <button
                  type="button"
                  onClick={() => handleBuyNft(nft)}
                  className="button-add"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
          <div className="detail__acitivty">
            <div className="acitivty_heading">Acitity</div>
            <div className="acitivty_list">
              {bidActivities?.map(act => {
                console.log('bidActivities', act);
                return (
                  <div className="activity_card">
                    {act?.bidderName}{' '}
                    <button
                      type="button"
                      onClick={() => checkWithdraw(nft)}
                      className="button-add"
                    >
                      CheckWithDraw
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleArt;
