import React, { useState } from 'react';

const ArtDescription = () => {
  const [description, setDescription] = useState('');
  const handleChange = event => {
    setDescription(event.target.value);
  };
  return (
    <div className="duration">
      <label htmlFor="duration__input">
        Art Description
        <input
          type="text"
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
