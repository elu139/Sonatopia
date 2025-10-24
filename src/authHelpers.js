import { authCreds } from './authCreds';
import axios from "axios";

const authHelpers = {
  // Generate a random string for code_verifier
  generateRandomString: function(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  },

  // Generate code_challenge from code_verifier using SHA256
  sha256: async function(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  },

  base64encode: function(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },

  // Main auth function using PKCE
  getAuth: async function () {
    const codeVerifier = this.generateRandomString(64);

    // Store code_verifier in sessionStorage for later use
    sessionStorage.setItem('code_verifier', codeVerifier);

    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    const params = new URLSearchParams({
      client_id: authCreds.client_id,
      response_type: 'code',
      redirect_uri: authCreds.redirect_uri,
      scope: authCreds.scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  // Get authorization code from callback and exchange for token
  getHashCode: async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      return null;
    }

    if (code) {
      const codeVerifier = sessionStorage.getItem('code_verifier');

      if (!codeVerifier) {
        console.error('Code verifier not found');
        return null;
      }

      // Exchange code for access token
      const token = await this.exchangeCodeForToken(code, codeVerifier);

      if (token) {
        // Clear the code_verifier from storage
        sessionStorage.removeItem('code_verifier');

        // Store token in cookie
        document.cookie = "spotiToken=" + token + ";max-age=3600;samesite=lax;Secure";
        await this.setUserID(token);
        return token;
      }
    }

    return null;
  },

  // Exchange authorization code for access token
  exchangeCodeForToken: async function(code, codeVerifier) {
    const params = new URLSearchParams({
      client_id: authCreds.client_id,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: authCreds.redirect_uri,
      code_verifier: codeVerifier,
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange failed:', errorData);
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  },
  setUserID: async function (token) {
    await axios({
        method: 'GET',
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    }).then(res => {
      if (res) {
        document.cookie = "spotiUID=" + res.data.id + ";max-age=3600;samesite=lax;Secure";
        if (res.data.display_name) {
          document.cookie = "spotiUN=" + res.data.display_name + ";max-age=3600;samesite=lax;Secure";
        }
      }
    })
  },
  getUserID: function () {
    if (document.cookie) {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('spotiUID='));
      return cookie ? cookie.split('=')[1] : null;
    }
    else {
      return null;
    }
  },
  getUsername: function () {
    if (document.cookie) {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('spotiUN='));
      return cookie ? cookie.split('=')[1] : null;
    }
    else {
      return null;
    }
  },
  getCookie: function () {
    if (document.cookie) {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('spotiToken='));
      return cookie ? cookie.split('=')[1] : null;
    }
    else {
      return null;
    }
  },
  checkCookie: function () {
    if (document.cookie.split(';').some((item) => item.trim().startsWith('spotiToken='))) {
      document.cookie = "selection=;max-age=0;samesite=lax;Secure";
      return true;
    }
    else {
      document.cookie = "selection=;max-age=0;samesite=lax;Secure";
      localStorage.removeItem("spotiData");
      return false;
    }
  },
  logout: function () {
    document.cookie = "spotiToken=;max-age=0;samesite=lax;Secure";
    document.cookie = "spotiUID=;max-age=0;samesite=lax;Secure";
    document.cookie = "spotiUN=;max-age=0;samesite=lax;Secure";
    document.cookie = "Selection=;max-age=0;samesite=lax;Secure";
    localStorage.removeItem("spotiData");
    window.location.reload();
  }
}

export default authHelpers;