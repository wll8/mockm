import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import HttpShow from './HttpShow.jsx';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <HttpShow />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
