import React from 'react';

const ArtName = ({ sellerName, handleChange }) => {
  return (
    <div className="duration">
      <label htmlFor="duration__input">
        Seller Name
        <input
          type="text"
          name="sellerName"
          value={sellerName}
          onChange={event => {
            handleChange(event);
          }}
          id="duration__input"
        />
      </label>
    </div>
  );
};

export default ArtName;
