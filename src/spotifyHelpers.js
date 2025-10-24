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

  /**
   * Get related artists for a given artist
   * @param {string} artistId - Spotify artist ID
   * @returns {Promise<array>} Array of related artists
   */
  getRelatedArtists: async function (artistId) {
    const code = authHelpers.getCookie();
    let result = [];
    try {
      await axios({
        method: "GET",
        url: `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
        headers: {
          Authorization: "Bearer " + code,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        json: true,
      }).then((res) => {
        result = res.data.artists;
      });
    } catch (error) {
      console.error(`Error fetching related artists for ${artistId}:`, error);
    }
    return result;
  },

  /**
   * Get multiple artists' details
   * @param {array} artistIds - Array of artist IDs
   * @returns {Promise<array>} Array of artist objects
   */
  getArtists: async function (artistIds) {
    const code = authHelpers.getCookie();
    let result = [];
    try {
      // Spotify API allows up to 50 artists per request
      const chunks = [];
      for (let i = 0; i < artistIds.length; i += 50) {
        chunks.push(artistIds.slice(i, i + 50));
      }

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const response = await axios({
          method: "GET",
          url: `https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`,
          headers: {
            Authorization: "Bearer " + code,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          json: true,
        });
        result = result.concat(response.data.artists);
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
    return result;
  },

  /**
   * Extract unique artists from a list of tracks
   * @param {array} tracks - Array of track objects
   * @returns {array} Array of unique artist objects with {id, name, genres}
   */
  extractArtistsFromTracks: function (tracks) {
    const artistMap = new Map();
    tracks.forEach((track) => {
      track.artists.forEach((artist) => {
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            uri: artist.uri,
          });
        }
      });
    });
    return Array.from(artistMap.values());
  },

  /**
   * Build network graph data structure
   * @param {array} seedArtists - Array of seed artist IDs or artist objects
   * @param {array} recommendedTracks - Array of recommended track objects
   * @returns {Promise<object>} Graph data with nodes and links
   */
  buildNetworkGraph: async function (seedArtists, recommendedTracks) {
    const nodes = [];
    const links = [];
    const processedArtists = new Set();

    // Helper to ensure we have full artist objects
    let seedArtistObjects = seedArtists;
    if (seedArtists.length > 0 && typeof seedArtists[0] === "string") {
      seedArtistObjects = await this.getArtists(seedArtists);
    }

    // Add seed artists as nodes (these are the user's top artists)
    seedArtistObjects.forEach((artist) => {
      if (!processedArtists.has(artist.id)) {
        nodes.push({
          id: artist.id,
          name: artist.name,
          type: "seed",
          popularity: artist.popularity || 50,
          genres: artist.genres || [],
          image: artist.images && artist.images[0] ? artist.images[0].url : null,
        });
        processedArtists.add(artist.id);
      }
    });

    // Extract artists from recommended tracks
    const recommendedArtists = this.extractArtistsFromTracks(recommendedTracks);

    // Get full details for recommended artists
    const recommendedArtistIds = recommendedArtists.map((a) => a.id);
    const recommendedArtistDetails = await this.getArtists(recommendedArtistIds);

    // Add recommended artists as nodes
    recommendedArtistDetails.forEach((artist) => {
      if (!processedArtists.has(artist.id)) {
        nodes.push({
          id: artist.id,
          name: artist.name,
          type: "recommendation",
          popularity: artist.popularity || 50,
          genres: artist.genres || [],
          image: artist.images && artist.images[0] ? artist.images[0].url : null,
        });
        processedArtists.add(artist.id);
      }
    });

    // Create links from seed artists to recommended artists
    // Link tracks to their artists
    recommendedTracks.forEach((track) => {
      track.artists.forEach((artist) => {
        // Find if any seed artist is related
        seedArtistObjects.forEach((seedArtist) => {
          // Create link if the recommended artist is different from seed
          if (artist.id !== seedArtist.id) {
            links.push({
              source: seedArtist.id,
              target: artist.id,
              value: 1, // Can be weighted by track popularity or other metrics
            });
          }
        });
      });
    });

    // Get related artists for seed artists to create more connections
    for (const seedArtist of seedArtistObjects.slice(0, 3)) {
      // Limit to first 3 to avoid too many API calls
      const relatedArtists = await this.getRelatedArtists(seedArtist.id);

      relatedArtists.slice(0, 5).forEach((relatedArtist) => {
        // Check if this related artist appears in our recommendations
        if (processedArtists.has(relatedArtist.id)) {
          links.push({
            source: seedArtist.id,
            target: relatedArtist.id,
            value: 2, // Higher value for direct relationships
            type: "related",
          });
        } else {
          // Add as a secondary node if not already present
          nodes.push({
            id: relatedArtist.id,
            name: relatedArtist.name,
            type: "related",
            popularity: relatedArtist.popularity || 50,
            genres: relatedArtist.genres || [],
            image: relatedArtist.images && relatedArtist.images[0]
              ? relatedArtist.images[0].url
              : null,
          });
          processedArtists.add(relatedArtist.id);

          links.push({
            source: seedArtist.id,
            target: relatedArtist.id,
            value: 2,
            type: "related",
          });
        }
      });
    }

    return { nodes, links };
  },

  /**
   * Calculate recommendation positioning relative to seed artists
   * @param {object} graphData - Graph data with nodes and links
   * @param {array} seedArtistIds - Array of seed artist IDs
   * @returns {object} Graph data with positioning metadata
   */
  calculateRecommendationPositions: function (graphData, seedArtistIds) {
    const { nodes, links } = graphData;

    // Create a map to store distances from seed artists
    const nodeDistances = new Map();

    nodes.forEach((node) => {
      if (seedArtistIds.includes(node.id)) {
        nodeDistances.set(node.id, {
          minDistance: 0,
          closestSeed: node.id,
          closestSeedName: node.name
        });
      }
    });

    // Calculate distances using BFS-like approach
    let changed = true;
    let maxIterations = 10;
    let iteration = 0;

    const updateDistance = (nodeId, distance, seed, seedName) => {
      nodeDistances.set(nodeId, {
        minDistance: distance,
        closestSeed: seed,
        closestSeedName: seedName,
      });
    };

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const sourceDistance = nodeDistances.get(link.source) ||
                              nodeDistances.get(link.source.id);
        const targetDistance = nodeDistances.get(link.target) ||
                              nodeDistances.get(link.target.id);

        if (sourceDistance && !targetDistance) {
          const targetId = typeof link.target === "string" ? link.target : link.target.id;
          updateDistance(
            targetId,
            sourceDistance.minDistance + 1,
            sourceDistance.closestSeed,
            sourceDistance.closestSeedName
          );
          changed = true;
        } else if (targetDistance && !sourceDistance) {
          const sourceId = typeof link.source === "string" ? link.source : link.source.id;
          updateDistance(
            sourceId,
            targetDistance.minDistance + 1,
            targetDistance.closestSeed,
            targetDistance.closestSeedName
          );
          changed = true;
        } else if (sourceDistance && targetDistance) {
          const targetId = typeof link.target === "string" ? link.target : link.target.id;
          const newDistance = sourceDistance.minDistance + 1;
          if (newDistance < targetDistance.minDistance) {
            updateDistance(
              targetId,
              newDistance,
              sourceDistance.closestSeed,
              sourceDistance.closestSeedName
            );
            changed = true;
          }
        }
      }
    }

    // Add positioning data to nodes
    const enhancedNodes = nodes.map((node) => {
      const distanceData = nodeDistances.get(node.id) || {
        minDistance: Infinity,
        closestSeed: null,
        closestSeedName: "Unknown"
      };
      return {
        ...node,
        distance: distanceData.minDistance,
        closestSeed: distanceData.closestSeed,
        closestSeedName: distanceData.closestSeedName,
      };
    });

    return { nodes: enhancedNodes, links };
  },
};

export default spotifyHelpers;
