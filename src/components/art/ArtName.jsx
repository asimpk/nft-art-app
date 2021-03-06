import React, { useState } from 'react';

const ArtName = ({ name, handleChange }) => {
  return (
    <div className="duration">
      <label htmlFor="duration__input">
        Art Name
        <input
          type="text"
          name="name"
          value={name}
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
