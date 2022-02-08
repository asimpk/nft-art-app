import React, { useState } from 'react';

const ArtName = () => {
  const [duration, setDuration] = useState('');
  const handleChange = event => {
    setDuration(event.target.value);
  };
  return (
    <div className="duration">
      <label htmlFor="duration__input">
        Art Name
        <input
          type="number"
          value={duration}
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
