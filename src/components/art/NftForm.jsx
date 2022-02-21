import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { useSelector } from 'react-redux';
import renderCanvasGIF from '../../utils/canvasGIF';
import ArtName from '../art/ArtName';
import ArtDescription from '../art/ArtDesciption';
import CreateNft from '../art/CreatNft';
import Preview from '../Preview';
import RadioSelector from '../RadioSelector';
import Web3Modal from 'web3modal';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import { nftaddress, nftmarketaddress } from '../../config';

import NFT from '../../artifacts/src/contracts/NFT.sol/NFT.json';
import NFTMarket from '../../artifacts/src/contracts/Market.sol/NFTMarket.json';
import "./NftForm.css"

const NftForm = () => {
  const [previewType, setPreviewType] = useState('single');
  const [formInput, updateFormInput] = useState({
    price: '1',
    name: 'asim',
    description: 'pixal art',
    biddingTime: '3600',
    sellerName: 'seller: Asim'
  });
  const globalState = useSelector(state => {
    const frames = state.present.get('frames');
    const activeFrameIndex = frames.get('activeIndex');
    return {
      frames: frames.get('list'),
      activeFrameIndex,
      activeFrame: frames.getIn(['list', activeFrameIndex]),
      paletteGridData: state.present.getIn(['palette', 'grid']),
      columns: frames.get('columns'),
      rows: frames.get('rows'),
      cellSize: state.present.get('cellSize'),
      duration: state.present.get('duration')
    };
  });

  async function addFile(file) {
    // const file = e.target.files[0]
    try {
      const added = await client.add(file, {
        progress: prog => console.log(`received: ${prog}`)
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      console.log('addFile', url);
      createMarket(url);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  }
  const createMarket = async fileUrl => {
    const { name, description, price, biddingTime, sellerName } = formInput;
    console.log(
      'createMarket',
      name,
      description,
      price,
      biddingTime,
      sellerName,
      fileUrl
    );
    if (
      !name ||
      !description ||
      !price ||
      !fileUrl ||
      !biddingTime ||
      !sellerName
    )
      return;
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  };

  async function createSale(url) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();
    console.log('tx.events', tx);
    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();
    const price = ethers.utils.parseUnits(formInput.price, 'ether');
    const biddingTime = formInput.biddingTime;
    const sellerName = ethers.utils.formatBytes32String(formInput.sellerName);

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await contract.createMarketItem(
      nftaddress,
      tokenId,
      price,
      biddingTime,
      sellerName,
      {
        value: listingPrice
      }
    );
  }

  const generateRadioOptions = state => {
    const options = [
      {
        value: 'single',
        description: 'single',
        labelFor: 'single',
        id: 3
      }
    ];
    if (state.frames.size > 1) {
      const spritesheetSupport = 'download';
      const animationOptionLabel = spritesheetSupport ? 'GIF' : 'animation';

      const animationOption = {
        value: 'animation',
        description: animationOptionLabel,
        labelFor: animationOptionLabel,
        id: 4
      };
      options.push(animationOption);
    }

    return options;
  };

  const getModalContent = state => {
    const options = generateRadioOptions(state);
    const previewBlock = (
      <>
        {previewType !== 'spritesheet' ? (
          <div className="modal__preview--wrapper">
            <Preview
              key="0"
              frames={state.frames}
              columns={state.columns}
              rows={state.rows}
              cellSize={state.type === 'preview' ? state.cellSize : 5}
              duration={state.duration}
              activeFrameIndex={state.activeFrameIndex}
              animate={previewType === 'animation'}
            />
          </div>
        ) : null}
      </>
    );
    const radioType = 'preview';
    const radioOptions = (
      <div className={`modal__${radioType}`}>
        <RadioSelector
          name={`${radioType}-type`}
          selected={previewType}
          change={changeRadioType}
          options={options}
        />
      </div>
    );

    return (
      <div>
        {radioOptions}
        {previewBlock}
      </div>
    );
  };

  const changeRadioType = (value, type) => {
    setPreviewType(value);
  };

  const dataURItoBlob = (dataURI, callback) => {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI
      .split(',')[0]
      .split(':')[1]
      .split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    callback(new Blob([ia], { type: mimeString }));
  };
  function blobToDataURL(blob, callback) {
    var a = new FileReader();
    a.onload = function(e) {
      callback(e.target.result);
    };
    a.readAsDataURL(blob);
  }
  const handleGif = blobData => {
    if (previewType === 'single') {
      dataURItoBlob(blobData, function(dataurl) {
        addFile(dataurl);
      });
    } else if (previewType === 'animation') {
      blobToDataURL(blobData, function(dataurl) {
        const blob = dataURItoBlob(dataurl, function(dataurl) {
          addFile(dataurl);
        });
      });
    }
  };

  const handleUploadImg = () => {
    if (previewType === 'single') {
      const imgBlob = renderCanvasGIF({ type: previewType, ...globalState });
      handleGif(imgBlob);
    } else if (previewType === 'animation') {
      renderCanvasGIF({ type: previewType, ...globalState }, handleGif);
    }
  };

  return (
    <div className="nftfrom">
      {getModalContent(globalState)}

      <ArtName />
      <ArtDescription />
      <CreateNft handleCreateNft={handleUploadImg} />
    </div>
  );
};
export default NftForm;
