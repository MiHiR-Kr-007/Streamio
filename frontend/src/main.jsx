import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import './index.css';
import { getCurrentUser } from './redux/slices/authSlice';

const token = localStorage.getItem('token');
if (token) {
  store.dispatch(getCurrentUser());
}

import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
