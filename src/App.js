import React, { useState, useEffect } from 'react';
import './content/css/App.scss';
import authHelpers from './authHelpers';
import Header from './components/header';
import Footer from './components/footer';
import Result from './components/result';
import Login from './components/login';

function App() {

  const [token, setToken] = useState('');
  const [data, setData] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      authHelpers.checkCookie();
      let token = authHelpers.getCookie();

      // Check if we have an authorization code in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code && !token) {
        // Exchange code for token
        token = await authHelpers.getHashCode();
        // Clear the URL parameters after processing
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (token) {
        setToken(token);
      }

      let data = JSON.parse(localStorage.getItem("spotiData"));
      if (data) {
        setData(data);
      }
    };

    initAuth();
  }, [])

  return (
    <div className="page-container">
      <div className='top'>
        <Header title='Explore'></Header>
        <Login token={token}></Login>
      </div>
      <div className="main">
        <div className='results-container'>
          {token ? <Result token={token} data={data}></Result> : ""}
        </div>
      </div>
      <div className="bottom"><Footer logged={token ? true : false}></Footer></div>
    </div>
  );
}

export default App;