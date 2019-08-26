import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "moment";
import "moment-duration-format";

import React from 'react';
import ReactDOM from 'react-dom';

import Root from './components/Root';
import configureStore from './store/configureStore';
import Api from './components/Api';
import { loginUser } from './actions/loginActions';
import * as serviceWorker from './serviceWorker';

import './styles/styles.scss';


const store = configureStore();

ReactDOM.render(
  <Root store={store} />,
  document.getElementById('root')
);

Api.restoreUser().done((data) => {
  store.dispatch(loginUser(data));
});

serviceWorker.unregister();
