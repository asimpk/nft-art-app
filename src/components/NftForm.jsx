import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import renderCanvasGIF from '../utils/canvasGIF';
import ArtName from './ArtName';
import ArtDescription from './ArtDesciption';
import CreateNft from './CreatNFT';
import Preview from './Preview';
import RadioSelector from './RadioSelector';

const NftForm = () => {
  const [previewType, setPreviewType] = useState('single');
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

  const generateRadioOptions = state => {
    let options = [
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
    let radioOptions = (
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
    console.log('changeRadioType', value, type);
    setPreviewType(value);
  };

  const handleCreateNft = () => {
    renderCanvasGIF({ type: previewType, ...globalState });
  };

  return (
    <div className="nftfrom">
      {getModalContent(globalState)}

      <ArtName />
      <ArtDescription />
      <CreateNft handleCreateNft={handleCreateNft} />
    </div>
  );
};
export default NftForm;
