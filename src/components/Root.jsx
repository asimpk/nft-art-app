import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';

import App from './App';
import Market from './market/Market';
import UserArts from './userArts/UserArts';
import SingleArt from './singleArt/SingleArt';

const Root = ({ store }) => {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <header>
          <div className="col-2-3">
            <Link to="/">
              {' '}
              <h1>Pixal Art NFT</h1>
            </Link>
          </div>
          <div className="col-1-3">
            <div className="header__menu">
              <div className="">
                <Link to="/">CREATE</Link>
              </div>
              <div className="">
                <Link to="/market">MARKET</Link>
              </div>
              {/* <div className="">
              <Link to="/single-art">Art</Link>
            </div> */}
              <div className="">
                <Link to="/user-arts">My Arts</Link>
              </div>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<App dispatch={store.dispatch} />} />
          <Route path="/market" element={<Market />} />
          <Route path="/user-arts" element={<UserArts />} />
          {/* <Route path="/single-art" element={<SingleArt />} /> */}
        </Routes>
      </Provider>
    </BrowserRouter>
  );
};

export default Root;
