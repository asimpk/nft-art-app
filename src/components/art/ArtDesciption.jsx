import React, { useState } from 'react';

const ArtDescription = ({ description, handleChange }) => {
  return (
    <div className="duration">
      <label htmlFor="duration__input">
        Art Description
        <input
          type="text"
          name="description"
          value={description}
          onChange={event => {
            handleChange(event);
          }}
          id="duration__input"
        />
      </label>
    </div>
  );
};

export default ArtDescription;
