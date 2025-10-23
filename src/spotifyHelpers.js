import axios from "axios";
import authHelpers from "./authHelpers";
import musicDiscoveryHelpers from "./musicDiscoveryHelpers";

const spotifyHelpers = {
  searchArtist: async function (val) {
    let code = authHelpers.getCookie();
    let artists = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/search?q=" + val + "&type=artist&limit=18",
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      artists = res.data.artists.items;
    });
    return artists;
  },
  searchTrack: async function (val) {
    let code = authHelpers.getCookie();
    let tracks = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/search?q=" + val + "&type=track&limit=24",
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      tracks = res.data.tracks.items;
    });
    return tracks;
  },
  databySelectedTracks: async function (tracks) {
    let code = authHelpers.getCookie();
    let data = await this.getbyTracksWithSeed(code, tracks);
    document.cookie = "selection=;max-age=0;samesite=lax;Secure";
    await this.formattedDatabyTracks(data);
  },
  databySelectedArtists: async function (artists) {
    let code = authHelpers.getCookie();
    let data = await this.getbyArtistsWithSeed(code, artists);
    document.cookie = "selection=;max-age=0;samesite=lax;Secure";
    await this.formattedDatabyArtists(data);
  },
  databyAllTimeTopTracks: async function (range) {
    let code = authHelpers.getCookie();
    let tracks = await this.getUserTopTracks(code, range);
    let seed = await this.getTrackSeed(tracks);
    let data = await this.getbyTracksWithSeed(code, seed);
    await this.formattedDatabyTracks(data);
  },
  databyAllTimeTopArtists: async function (range) {
    let code = authHelpers.getCookie();
    let artists = await this.getUserTopArtists(code, range);
    let seed = await this.getArtistSeed(artists);
    let data = await this.getbyArtistsWithSeed(code, seed);
    await this.formattedDatabyArtists(data);
  },
  formattedDatabyTracks: async function (data) {
    let result = {
      seeds: data[0].seeds,
      tracks: data[0].tracks,
    };
    localStorage.setItem("spotiData", JSON.stringify(result));
    window.location.reload();
  },
  formattedDatabyArtists: async function (data) {
    let result = {
      seeds: data[0].seeds,
      tracks: data[0].tracks,
    };
    localStorage.setItem("spotiData", JSON.stringify(result));
    window.location.reload();
  },
  getTrackSeed: async function (res) {
    let trackSeed = [];
    res[0].items.forEach((e) => {
      trackSeed.push(e.id);
    });
    return trackSeed;
  },
  getArtistSeed: async function (res) {
    let artistSeed = [];
    res[0].items.forEach((e) => {
      artistSeed.push(e.id);
    });
    return artistSeed;
  },
  getUserTopTracks: async function (code, range) {
    let result = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=" + range,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      result.push(res.data);
    });
    return result;
  },
  getUserTopArtists: async function (code, range) {
    let result = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=" + range,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      result.push(res.data);
    });
    return result;
  },
  getbyTracksWithSeed: async function (code, trackSeed) {
    let result = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=" +
        trackSeed,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      result.push(res.data);
    });
    return result;
  },
  getbyArtistsWithSeed: async function (code, artistSeed) {
    let result = [];
    await axios({
      method: "GET",
      url:
        "https://api.spotify.com/v1/recommendations?limit=100&seed_artists=" +
        artistSeed,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    }).then((res) => {
      result.push(res.data);
    });
    return result;
  },
  createPlaylist: async function () {
    let code = authHelpers.getCookie();
    let uid = authHelpers.getUserID();
    let uname = authHelpers.getUsername();
    let pname = "";
    if (uname) {
      pname = "created for " + uname + ", by Explore Spotify";
    } else {
      pname = "created for " + uid + ", by Explore Spotify";
    }

    let pid = "";
    await axios({
      method: "POST",
      url: "https://api.spotify.com/v1/users/" + uid + "/playlists",
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: {
        name: pname,
        public: false,
      },
      json: true,
    }).then((res) => {
      pid = res.data.id;
    });
    await this.populatePlaylist(code, pid);
    window.open("https://open.spotify.com/playlist/" + pid, "_blank");
  },
  populatePlaylist: async function (code, pid) {
    let tUris = JSON.parse(localStorage.getItem("spotiData")).tracks.map(
      (t) => t.uri
    );
    let snapid = "";
    await axios({
      method: "POST",
      url: "https://api.spotify.com/v1/playlists/" + pid + "/tracks",
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: {
        uris: tUris,
        position: 0,
      },
      json: true,
    }).then((res) => {
      snapid = res;
    });
    return snapid;
  },

  /**
   * Get recommendations with mood-based filtering
   * @param {string} mood - One of: energetic, chill, focus, happy, melancholic, party, workout, sleep
   * @param {array} seedTracks - Track IDs (optional)
   * @param {array} seedArtists - Artist IDs (optional)
   * @param {number} limit - Number of recommendations
   * @returns {Promise<array>} Array with recommendations data
   */
  getRecommendationsWithMood: async function (
    mood,
    seedTracks = [],
    seedArtists = [],
    limit = 100
  ) {
    const code = authHelpers.getCookie();
    const data = await musicDiscoveryHelpers.getRecommendationsWithMood(
      code,
      mood,
      seedTracks,
      seedArtists,
      limit
    );
    return [data];
  },

  /**
   * Get recommendations with discovery slider
   * @param {number} discoveryLevel - 0 (safe/similar) to 100 (adventurous/diverse)
   * @param {array} seedTracks - Track IDs
   * @param {array} seedArtists - Artist IDs (optional)
   * @param {number} limit - Number of recommendations
   * @returns {Promise<array>} Array with recommendations data
   */
  getRecommendationsWithDiscovery: async function (
    discoveryLevel,
    seedTracks = [],
    seedArtists = [],
    limit = 100
  ) {
    const code = authHelpers.getCookie();

    // Get audio features for seed tracks to inform discovery algorithm
    let audioFeatures = null;
    if (seedTracks.length > 0) {
      const features = await musicDiscoveryHelpers.getAudioFeatures(
        code,
        seedTracks
      );
      audioFeatures = musicDiscoveryHelpers.calculateAverageAudioFeatures(
        features
      );
    }

    const data = await musicDiscoveryHelpers.getRecommendationsWithDiscoverySlider(
      code,
      discoveryLevel,
      seedTracks,
      seedArtists,
      audioFeatures,
      limit
    );
    return [data];
  },

  /**
   * Get recommendations with both mood and discovery level
   * @param {string} mood - Mood preset name
   * @param {number} discoveryLevel - 0 to 100
   * @param {array} seedTracks - Track IDs
   * @param {array} seedArtists - Artist IDs (optional)
   * @param {number} limit - Number of recommendations
   * @returns {Promise<array>} Array with recommendations data
   */
  getRecommendationsWithMoodAndDiscovery: async function (
    mood,
    discoveryLevel,
    seedTracks = [],
    seedArtists = [],
    limit = 100
  ) {
    const code = authHelpers.getCookie();
    const data = await musicDiscoveryHelpers.getRecommendationsWithMoodAndDiscovery(
      code,
      mood,
      discoveryLevel,
      seedTracks,
      seedArtists,
      limit
    );
    return [data];
  },

  /**
   * Enhanced version of databyAllTimeTopTracks with mood filtering
   */
  databyAllTimeTopTracksWithMood: async function (range, mood) {
    let code = authHelpers.getCookie();
    let tracks = await this.getUserTopTracks(code, range);
    let seed = await this.getTrackSeed(tracks);
    let data = await this.getRecommendationsWithMood(mood, seed);
    await this.formattedDatabyTracks(data);
  },

  /**
   * Enhanced version of databyAllTimeTopArtists with mood filtering
   */
  databyAllTimeTopArtistsWithMood: async function (range, mood) {
    let code = authHelpers.getCookie();
    let artists = await this.getUserTopArtists(code, range);
    let seed = await this.getArtistSeed(artists);
    let data = await this.getRecommendationsWithMood(mood, [], seed);
    await this.formattedDatabyArtists(data);
  },

  /**
   * Enhanced version of databyAllTimeTopTracks with discovery slider
   */
  databyAllTimeTopTracksWithDiscovery: async function (range, discoveryLevel) {
    let code = authHelpers.getCookie();
    let tracks = await this.getUserTopTracks(code, range);
    let seed = await this.getTrackSeed(tracks);
    let data = await this.getRecommendationsWithDiscovery(discoveryLevel, seed);
    await this.formattedDatabyTracks(data);
  },

  /**
   * Enhanced version of databyAllTimeTopArtists with discovery slider
   */
  databyAllTimeTopArtistsWithDiscovery: async function (
    range,
    discoveryLevel
  ) {
    let code = authHelpers.getCookie();
    let artists = await this.getUserTopArtists(code, range);
    let seed = await this.getArtistSeed(artists);
    let data = await this.getRecommendationsWithDiscovery(
      discoveryLevel,
      [],
      seed
    );
    await this.formattedDatabyArtists(data);
  },

  /**
   * Enhanced version with both mood and discovery
   */
  databyAllTimeTopTracksWithMoodAndDiscovery: async function (
    range,
    mood,
    discoveryLevel
  ) {
    let code = authHelpers.getCookie();
    let tracks = await this.getUserTopTracks(code, range);
    let seed = await this.getTrackSeed(tracks);
    let data = await this.getRecommendationsWithMoodAndDiscovery(
      mood,
      discoveryLevel,
      seed
    );
    await this.formattedDatabyTracks(data);
  },

  /**
   * Enhanced version with both mood and discovery for artists
   */
  databyAllTimeTopArtistsWithMoodAndDiscovery: async function (
    range,
    mood,
    discoveryLevel
  ) {
    let code = authHelpers.getCookie();
    let artists = await this.getUserTopArtists(code, range);
    let seed = await this.getArtistSeed(artists);
    let data = await this.getRecommendationsWithMoodAndDiscovery(
      mood,
      discoveryLevel,
      [],
      seed
    );
    await this.formattedDatabyArtists(data);
  },
};

export default spotifyHelpers;
