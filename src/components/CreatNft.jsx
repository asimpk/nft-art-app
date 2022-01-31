import React from 'react';

const CreateNft = ({ handleCreateNft }) => {
  return (
    <button type="button" className="download-btn" onClick={handleCreateNft}>
      Create Nft
    </button>
  );
};

export default CreateNft;
