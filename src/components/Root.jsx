import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import Market from './Market';

const Root = ({ store }) => (
  <BrowserRouter>
    <Provider store={store}>
      <header>
        <div class="col-2-3">
          <Link to="/">
            {' '}
            <h1>Pixal Art NFT</h1>
          </Link>
        </div>
        <div class="col-1-3">
          <div class="header__menu">
            <div class="">
              <Link to="/">CREATE</Link>
            </div>
            <div class="">
              <Link to="/market">MARKET</Link>
            </div>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<App dispatch={store.dispatch} />} />
        <Route path="/market" element={<Market />} />
        {/* <Route path="about" element={<About />} /> */}
      </Routes>
    </Provider>
  </BrowserRouter>
);

export default Root;
