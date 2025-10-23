import axios from "axios";

/**
 * Music Discovery Helpers
 * Provides advanced recommendation features including mood/energy-based filtering
 * and discovery slider for controlling recommendation diversity
 */

const musicDiscoveryHelpers = {
  /**
   * Mood presets based on Spotify's audio features
   * Each preset defines target values for audio features:
   * - energy: 0.0 to 1.0 (intensity and activity)
   * - valence: 0.0 to 1.0 (musical positiveness)
   * - danceability: 0.0 to 1.0 (how suitable for dancing)
   * - tempo: BPM (beats per minute)
   */
  moodPresets: {
    energetic: {
      target_energy: 0.8,
      target_valence: 0.7,
      target_danceability: 0.7,
      min_tempo: 120,
      target_tempo: 140,
    },
    chill: {
      target_energy: 0.3,
      target_valence: 0.5,
      target_danceability: 0.4,
      max_tempo: 100,
      target_tempo: 85,
    },
    focus: {
      target_energy: 0.4,
      target_valence: 0.4,
      target_instrumentalness: 0.7,
      max_speechiness: 0.2,
      target_tempo: 100,
    },
    happy: {
      target_energy: 0.7,
      target_valence: 0.9,
      target_danceability: 0.6,
      target_tempo: 120,
    },
    melancholic: {
      target_energy: 0.3,
      target_valence: 0.2,
      target_acousticness: 0.6,
      max_tempo: 90,
      target_tempo: 75,
    },
    party: {
      target_energy: 0.9,
      target_valence: 0.8,
      target_danceability: 0.85,
      min_tempo: 120,
      target_tempo: 128,
    },
    workout: {
      target_energy: 0.85,
      target_danceability: 0.7,
      min_tempo: 130,
      target_tempo: 145,
    },
    sleep: {
      target_energy: 0.2,
      target_valence: 0.3,
      target_acousticness: 0.8,
      target_instrumentalness: 0.6,
      max_tempo: 70,
      target_tempo: 60,
    },
  },

  /**
   * Get recommendations with mood/energy filtering
   * @param {string} code - Spotify access token
   * @param {string} moodPreset - One of: energetic, chill, focus, happy, melancholic, party, workout, sleep
   * @param {array} seedTracks - Array of track IDs (max 5)
   * @param {array} seedArtists - Array of artist IDs (max 5)
   * @param {number} limit - Number of recommendations (default 100, max 100)
   * @returns {Promise<object>} Recommendations data
   */
  getRecommendationsWithMood: async function (
    code,
    moodPreset,
    seedTracks = [],
    seedArtists = [],
    limit = 100
  ) {
    const mood = this.moodPresets[moodPreset];
    if (!mood) {
      throw new Error(
        `Invalid mood preset: ${moodPreset}. Available: ${Object.keys(
          this.moodPresets
        ).join(", ")}`
      );
    }

    // Build query parameters for audio features
    let params = new URLSearchParams({
      limit: Math.min(limit, 100),
    });

    // Add seeds (Spotify API requires at least 1 seed, max 5 total)
    if (seedTracks.length > 0) {
      params.append("seed_tracks", seedTracks.slice(0, 5).join(","));
    }
    if (seedArtists.length > 0) {
      const remainingSlots = 5 - seedTracks.length;
      params.append(
        "seed_artists",
        seedArtists.slice(0, remainingSlots).join(",")
      );
    }

    // Add mood-based audio features
    Object.entries(mood).forEach(([key, value]) => {
      params.append(key, value);
    });

    const result = await axios({
      method: "GET",
      url: `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    });

    return result.data;
  },

  /**
   * Discovery Slider: Control recommendation diversity
   *
   * The discovery slider adjusts how similar/diverse recommendations are:
   * - 0 = Very safe (very similar to seeds, high popularity)
   * - 50 = Balanced mix
   * - 100 = Very adventurous (diverse from seeds, include obscure tracks)
   *
   * Algorithm:
   * - Lower values: increase popularity weight, tighter audio feature matching
   * - Higher values: decrease popularity, looser audio feature matching, explore obscure artists
   *
   * @param {string} code - Spotify access token
   * @param {number} discoveryLevel - 0 to 100 (0=safe, 100=adventurous)
   * @param {array} seedTracks - Array of track IDs
   * @param {array} seedArtists - Array of artist IDs
   * @param {object} audioFeatures - Optional audio features from seed tracks
   * @param {number} limit - Number of recommendations
   * @returns {Promise<object>} Recommendations data
   */
  getRecommendationsWithDiscoverySlider: async function (
    code,
    discoveryLevel,
    seedTracks = [],
    seedArtists = [],
    audioFeatures = null,
    limit = 100
  ) {
    if (discoveryLevel < 0 || discoveryLevel > 100) {
      throw new Error("Discovery level must be between 0 and 100");
    }

    let params = new URLSearchParams({
      limit: Math.min(limit, 100),
    });

    // Add seeds
    if (seedTracks.length > 0) {
      params.append("seed_tracks", seedTracks.slice(0, 5).join(","));
    }
    if (seedArtists.length > 0) {
      const remainingSlots = 5 - seedTracks.length;
      params.append(
        "seed_artists",
        seedArtists.slice(0, remainingSlots).join(",")
      );
    }

    // Calculate popularity range based on discovery level
    // Low discovery = high popularity (50-100)
    // High discovery = low popularity (0-50)
    const popularityMin = Math.max(0, 100 - discoveryLevel * 1.5);
    const popularityMax = Math.max(30, 100 - discoveryLevel * 0.5);

    params.append("min_popularity", Math.round(popularityMin));
    params.append("max_popularity", Math.round(popularityMax));

    // If we have audio features from seeds, apply discovery-based variance
    if (audioFeatures) {
      // At low discovery: match features closely (tight range)
      // At high discovery: allow more variance (loose range)
      const variance = discoveryLevel / 100; // 0.0 to 1.0

      if (audioFeatures.energy !== undefined) {
        const energyTarget = audioFeatures.energy;
        const energyRange = 0.3 * variance; // Range increases with discovery
        params.append("target_energy", energyTarget.toFixed(2));
        if (discoveryLevel < 50) {
          // Only set min/max for safe mode to keep it similar
          params.append("min_energy", Math.max(0, energyTarget - energyRange).toFixed(2));
          params.append("max_energy", Math.min(1, energyTarget + energyRange).toFixed(2));
        }
      }

      if (audioFeatures.valence !== undefined) {
        const valenceTarget = audioFeatures.valence;
        const valenceRange = 0.3 * variance;
        params.append("target_valence", valenceTarget.toFixed(2));
        if (discoveryLevel < 50) {
          params.append("min_valence", Math.max(0, valenceTarget - valenceRange).toFixed(2));
          params.append("max_valence", Math.min(1, valenceTarget + valenceRange).toFixed(2));
        }
      }

      if (audioFeatures.danceability !== undefined) {
        const danceTarget = audioFeatures.danceability;
        const danceRange = 0.3 * variance;
        params.append("target_danceability", danceTarget.toFixed(2));
        if (discoveryLevel < 50) {
          params.append("min_danceability", Math.max(0, danceTarget - danceRange).toFixed(2));
          params.append("max_danceability", Math.min(1, danceTarget + danceRange).toFixed(2));
        }
      }

      if (audioFeatures.tempo !== undefined) {
        const tempoTarget = audioFeatures.tempo;
        const tempoRange = 30 * variance; // BPM range
        params.append("target_tempo", Math.round(tempoTarget));
        if (discoveryLevel < 50) {
          params.append("min_tempo", Math.round(Math.max(40, tempoTarget - tempoRange)));
          params.append("max_tempo", Math.round(Math.min(200, tempoTarget + tempoRange)));
        }
      }
    }

    const result = await axios({
      method: "GET",
      url: `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    });

    return result.data;
  },

  /**
   * Get audio features for multiple tracks
   * Used to analyze seed tracks before applying discovery slider
   * @param {string} code - Spotify access token
   * @param {array} trackIds - Array of track IDs (max 100)
   * @returns {Promise<object>} Audio features data
   */
  getAudioFeatures: async function (code, trackIds) {
    if (!trackIds || trackIds.length === 0) {
      throw new Error("At least one track ID is required");
    }

    const result = await axios({
      method: "GET",
      url: `https://api.spotify.com/v1/audio-features?ids=${trackIds.slice(0, 100).join(",")}`,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    });

    return result.data.audio_features;
  },

  /**
   * Calculate average audio features from multiple tracks
   * Used to determine the overall "sound" of seed tracks
   * @param {array} audioFeaturesArray - Array of audio feature objects
   * @returns {object} Average audio features
   */
  calculateAverageAudioFeatures: function (audioFeaturesArray) {
    if (!audioFeaturesArray || audioFeaturesArray.length === 0) {
      return null;
    }

    // Filter out null values
    const validFeatures = audioFeaturesArray.filter((f) => f !== null);
    if (validFeatures.length === 0) {
      return null;
    }

    const sum = validFeatures.reduce(
      (acc, features) => {
        acc.energy += features.energy || 0;
        acc.valence += features.valence || 0;
        acc.danceability += features.danceability || 0;
        acc.tempo += features.tempo || 0;
        acc.acousticness += features.acousticness || 0;
        acc.instrumentalness += features.instrumentalness || 0;
        acc.speechiness += features.speechiness || 0;
        return acc;
      },
      {
        energy: 0,
        valence: 0,
        danceability: 0,
        tempo: 0,
        acousticness: 0,
        instrumentalness: 0,
        speechiness: 0,
      }
    );

    const count = validFeatures.length;
    return {
      energy: sum.energy / count,
      valence: sum.valence / count,
      danceability: sum.danceability / count,
      tempo: sum.tempo / count,
      acousticness: sum.acousticness / count,
      instrumentalness: sum.instrumentalness / count,
      speechiness: sum.speechiness / count,
    };
  },

  /**
   * Combined function: Get recommendations with both mood and discovery level
   * @param {string} code - Spotify access token
   * @param {string} moodPreset - Mood preset name
   * @param {number} discoveryLevel - 0-100 discovery level
   * @param {array} seedTracks - Track IDs
   * @param {array} seedArtists - Artist IDs
   * @param {number} limit - Number of recommendations
   * @returns {Promise<object>} Recommendations data
   */
  getRecommendationsWithMoodAndDiscovery: async function (
    code,
    moodPreset,
    discoveryLevel,
    seedTracks = [],
    seedArtists = [],
    limit = 100
  ) {
    const mood = this.moodPresets[moodPreset];
    if (!mood) {
      throw new Error(`Invalid mood preset: ${moodPreset}`);
    }

    if (discoveryLevel < 0 || discoveryLevel > 100) {
      throw new Error("Discovery level must be between 0 and 100");
    }

    let params = new URLSearchParams({
      limit: Math.min(limit, 100),
    });

    // Add seeds
    if (seedTracks.length > 0) {
      params.append("seed_tracks", seedTracks.slice(0, 5).join(","));
    }
    if (seedArtists.length > 0) {
      const remainingSlots = 5 - seedTracks.length;
      params.append(
        "seed_artists",
        seedArtists.slice(0, remainingSlots).join(",")
      );
    }

    // Add mood parameters
    Object.entries(mood).forEach(([key, value]) => {
      params.append(key, value);
    });

    // Add discovery-based popularity
    const popularityMin = Math.max(0, 100 - discoveryLevel * 1.5);
    const popularityMax = Math.max(30, 100 - discoveryLevel * 0.5);
    params.append("min_popularity", Math.round(popularityMin));
    params.append("max_popularity", Math.round(popularityMax));

    const result = await axios({
      method: "GET",
      url: `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      headers: {
        Authorization: "Bearer " + code,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
    });

    return result.data;
  },
};

export default musicDiscoveryHelpers;
