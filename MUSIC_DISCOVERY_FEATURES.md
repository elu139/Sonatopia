# Music Discovery Features - Documentation!

## Overview

Sonatopia now includes advanced music discovery features that enhance recommendation quality through:

1. **Mood/Energy-Based Filtering** - Get recommendations tailored to specific moods using Spotify's audio features
2. **Discovery Slider** - Control how similar or diverse recommendations are (0=safe, 100=adventurous)

These features are implemented in `src/musicDiscoveryHelpers.js` and integrated into `src/spotifyHelpers.js`.

---

## 1. Mood-Based Filtering

### Available Mood Presets

The system includes 8 pre-configured mood presets based on Spotify's audio features (energy, valence, danceability, tempo, etc.):

| Mood | Description | Use Case |
|------|-------------|----------|
| `energetic` | High energy, upbeat tracks | Cardio, motivation |
| `chill` | Low energy, relaxed vibes | Relaxation, studying |
| `focus` | Instrumental, low distraction | Deep work, concentration |
| `happy` | Positive, cheerful music | Good mood, celebrations |
| `melancholic` | Sad, introspective tracks | Reflection, emotional moments |
| `party` | Dance-friendly, high energy | Social gatherings, dancing |
| `workout` | High tempo, energizing | Gym, exercise |
| `sleep` | Very calm, instrumental | Sleep, meditation |

### Audio Features Used

Each mood preset defines target values for:
- **Energy** (0.0-1.0): Intensity and activity level
- **Valence** (0.0-1.0): Musical positiveness/happiness
- **Danceability** (0.0-1.0): How suitable for dancing
- **Tempo** (BPM): Beats per minute
- **Acousticness** (0.0-1.0): Likelihood of being acoustic
- **Instrumentalness** (0.0-1.0): Predicts no vocals
- **Speechiness** (0.0-1.0): Presence of spoken words

### Usage Examples

#### Basic Usage - Mood Only

```javascript
import spotifyHelpers from './spotifyHelpers';

// Get "chill" recommendations based on user's top tracks
await spotifyHelpers.databyAllTimeTopTracksWithMood('short_term', 'chill');

// Get "workout" recommendations based on user's top artists
await spotifyHelpers.databyAllTimeTopArtistsWithMood('medium_term', 'workout');
```

#### Advanced Usage - With Custom Seeds

```javascript
import spotifyHelpers from './spotifyHelpers';

// Get "party" recommendations from specific tracks
const trackIds = ['trackId1', 'trackId2', 'trackId3'];
const data = await spotifyHelpers.getRecommendationsWithMood('party', trackIds);

// Get "focus" recommendations from specific artists
const artistIds = ['artistId1', 'artistId2'];
const data = await spotifyHelpers.getRecommendationsWithMood('focus', [], artistIds);

// Mix of tracks and artists
const data = await spotifyHelpers.getRecommendationsWithMood(
  'energetic',
  ['trackId1', 'trackId2'],
  ['artistId1'],
  50  // limit to 50 recommendations
);
```

---

## 2. Discovery Slider

### How It Works

The discovery slider controls recommendation diversity on a scale of 0-100:

- **0-30 (Safe Mode)**: Very similar to your seeds, popular tracks only
- **30-60 (Balanced)**: Mix of familiar and new, moderate popularity
- **60-100 (Adventurous)**: Diverse recommendations, includes obscure tracks

### Algorithm Details

The slider adjusts:

1. **Popularity Range**
   - Low discovery (0): Popular tracks (50-100 popularity)
   - High discovery (100): Obscure tracks (0-50 popularity)

2. **Audio Feature Matching**
   - Low discovery: Tight matching to seed audio features
   - High discovery: Loose matching, more variance allowed

3. **Seed Analysis**
   - Automatically analyzes audio features of seed tracks
   - Uses average features to guide recommendations

### Usage Examples

#### Basic Usage - Discovery Slider Only

```javascript
import spotifyHelpers from './spotifyHelpers';

// Safe recommendations (very similar to your top tracks)
await spotifyHelpers.databyAllTimeTopTracksWithDiscovery('short_term', 20);

// Adventurous recommendations (discover new artists)
await spotifyHelpers.databyAllTimeTopArtistsWithDiscovery('long_term', 85);
```

#### Advanced Usage - With Custom Seeds

```javascript
import spotifyHelpers from './spotifyHelpers';

// Balanced discovery from specific tracks
const trackIds = ['trackId1', 'trackId2', 'trackId3'];
const data = await spotifyHelpers.getRecommendationsWithDiscovery(50, trackIds);

// Very adventurous recommendations from artists
const artistIds = ['artistId1', 'artistId2'];
const data = await spotifyHelpers.getRecommendationsWithDiscovery(90, [], artistIds);

// Mix with custom limit
const data = await spotifyHelpers.getRecommendationsWithDiscovery(
  65,
  ['trackId1'],
  ['artistId1'],
  25  // limit to 25 recommendations
);
```

---

## 3. Combined: Mood + Discovery

### Why Combine?

Combining mood filtering with the discovery slider gives you the best of both worlds:
- **Mood**: Sets the vibe/energy of recommendations
- **Discovery**: Controls how adventurous the selections are

### Usage Examples

#### Using Top Tracks/Artists

```javascript
import spotifyHelpers from './spotifyHelpers';

// Chill music, but include some obscure tracks
await spotifyHelpers.databyAllTimeTopTracksWithMoodAndDiscovery(
  'short_term',   // time range
  'chill',        // mood
  70              // discovery level
);

// Workout music, stick to popular tracks
await spotifyHelpers.databyAllTimeTopArtistsWithMoodAndDiscovery(
  'medium_term',
  'workout',
  25
);
```

#### With Custom Seeds

```javascript
import spotifyHelpers from './spotifyHelpers';

// Party mood with moderate discovery
const trackIds = ['trackId1', 'trackId2'];
const data = await spotifyHelpers.getRecommendationsWithMoodAndDiscovery(
  'party',
  50,
  trackIds
);

// Focus music with high discovery (find new instrumental artists)
const artistIds = ['artistId1'];
const data = await spotifyHelpers.getRecommendationsWithMoodAndDiscovery(
  'focus',
  80,
  [],
  artistIds,
  30  // limit
);
```

---

## 4. Integration Guide

### Current Integration Points

The new features are already integrated into the existing `spotifyHelpers.js` API. You can call them from any component:

```javascript
import spotifyHelpers from './spotifyHelpers';

// In your component or function
const handleMoodRecommendations = async (mood) => {
  await spotifyHelpers.databyAllTimeTopTracksWithMood('short_term', mood);
  // Results will be stored in localStorage and page will reload
};

const handleDiscoveryRecommendations = async (level) => {
  await spotifyHelpers.databyAllTimeTopTracksWithDiscovery('short_term', level);
};
```

### Frontend Integration Ideas

To add UI controls, you could create:

1. **Mood Selector Component**
```javascript
<select onChange={(e) => handleMoodRecommendations(e.target.value)}>
  <option value="energetic">Energetic</option>
  <option value="chill">Chill</option>
  <option value="focus">Focus</option>
  <option value="happy">Happy</option>
  <option value="melancholic">Melancholic</option>
  <option value="party">Party</option>
  <option value="workout">Workout</option>
  <option value="sleep">Sleep</option>
</select>
```

2. **Discovery Slider Component**
```javascript
<div>
  <label>Discovery Level: {discoveryLevel}</label>
  <input
    type="range"
    min="0"
    max="100"
    value={discoveryLevel}
    onChange={(e) => setDiscoveryLevel(e.target.value)}
  />
  <span>{discoveryLevel < 30 ? 'Safe' : discoveryLevel < 70 ? 'Balanced' : 'Adventurous'}</span>
</div>
```

3. **Combined Controls**
```javascript
<button onClick={() =>
  spotifyHelpers.databyAllTimeTopTracksWithMoodAndDiscovery(
    'short_term',
    selectedMood,
    discoveryLevel
  )
}>
  Get {selectedMood} Recommendations (Discovery: {discoveryLevel})
</button>
```

---

## 5. Direct API Usage (Advanced)

If you need more control, you can use `musicDiscoveryHelpers` directly:

```javascript
import musicDiscoveryHelpers from './musicDiscoveryHelpers';
import authHelpers from './authHelpers';

const code = authHelpers.getCookie();

// Get audio features for tracks
const features = await musicDiscoveryHelpers.getAudioFeatures(
  code,
  ['trackId1', 'trackId2', 'trackId3']
);

// Calculate average features
const avgFeatures = musicDiscoveryHelpers.calculateAverageAudioFeatures(features);
console.log('Average energy:', avgFeatures.energy);
console.log('Average valence:', avgFeatures.valence);

// Get recommendations with full control
const recommendations = await musicDiscoveryHelpers.getRecommendationsWithMood(
  code,
  'energetic',
  ['trackId1'],
  ['artistId1'],
  50
);
```

---

## 6. Mood Preset Details

### Technical Specifications

#### Energetic
```javascript
{
  target_energy: 0.8,
  target_valence: 0.7,
  target_danceability: 0.7,
  min_tempo: 120,
  target_tempo: 140
}
```

#### Chill
```javascript
{
  target_energy: 0.3,
  target_valence: 0.5,
  target_danceability: 0.4,
  max_tempo: 100,
  target_tempo: 85
}
```

#### Focus
```javascript
{
  target_energy: 0.4,
  target_valence: 0.4,
  target_instrumentalness: 0.7,
  max_speechiness: 0.2,
  target_tempo: 100
}
```

#### Happy
```javascript
{
  target_energy: 0.7,
  target_valence: 0.9,
  target_danceability: 0.6,
  target_tempo: 120
}
```

#### Melancholic
```javascript
{
  target_energy: 0.3,
  target_valence: 0.2,
  target_acousticness: 0.6,
  max_tempo: 90,
  target_tempo: 75
}
```

#### Party
```javascript
{
  target_energy: 0.9,
  target_valence: 0.8,
  target_danceability: 0.85,
  min_tempo: 120,
  target_tempo: 128
}
```

#### Workout
```javascript
{
  target_energy: 0.85,
  target_danceability: 0.7,
  min_tempo: 130,
  target_tempo: 145
}
```

#### Sleep
```javascript
{
  target_energy: 0.2,
  target_valence: 0.3,
  target_acousticness: 0.8,
  target_instrumentalness: 0.6,
  max_tempo: 70,
  target_tempo: 60
}
```

---

## 7. Best Practices

### When to Use Mood Filtering
- User wants specific vibe or context (workout, study, party)
- Building themed playlists
- Matching music to activities or times of day

### When to Use Discovery Slider
- User wants to explore new music vs. stick to familiar
- Balancing between comfort and discovery
- Finding "hidden gems" (high discovery level)

### When to Combine Both
- Best for most use cases
- Provides maximum flexibility
- Example: "Find me new chill music to discover" (mood=chill, discovery=80)

### Seed Selection Tips
- Use 2-5 seeds for best results (Spotify API limitation)
- Mix tracks and artists for diverse results
- Use user's recent or top items for personalization

---

## 8. Error Handling

All functions include basic error handling. Common errors:

```javascript
// Invalid mood preset
try {
  await spotifyHelpers.getRecommendationsWithMood('invalid', trackIds);
} catch (error) {
  console.error(error.message);
  // "Invalid mood preset: invalid. Available: energetic, chill, ..."
}

// Discovery level out of range
try {
  await spotifyHelpers.getRecommendationsWithDiscovery(150, trackIds);
} catch (error) {
  console.error(error.message);
  // "Discovery level must be between 0 and 100"
}

// No seeds provided
try {
  await musicDiscoveryHelpers.getAudioFeatures(code, []);
} catch (error) {
  console.error(error.message);
  // "At least one track ID is required"
}
```

---

## 9. Future Enhancements

Potential improvements from IDEAS.md:

- **Trending taste detection**: Analyze recent listening history to detect taste changes
- **Network graph visualization**: Show how recommendations relate to user's taste profile
- **Contextual playlists**: Auto-detect context (time of day, location) and suggest mood
- **Custom mood presets**: Allow users to create and save their own mood configurations
- **A/B testing**: Compare recommendations from different algorithms

---

## 10. API Reference

### spotifyHelpers Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getRecommendationsWithMood` | mood, seedTracks, seedArtists, limit | Promise<array> | Get mood-filtered recommendations |
| `getRecommendationsWithDiscovery` | discoveryLevel, seedTracks, seedArtists, limit | Promise<array> | Get discovery-adjusted recommendations |
| `getRecommendationsWithMoodAndDiscovery` | mood, discoveryLevel, seedTracks, seedArtists, limit | Promise<array> | Combined mood and discovery |
| `databyAllTimeTopTracksWithMood` | range, mood | Promise<void> | Mood-filtered from user's top tracks |
| `databyAllTimeTopArtistsWithMood` | range, mood | Promise<void> | Mood-filtered from user's top artists |
| `databyAllTimeTopTracksWithDiscovery` | range, discoveryLevel | Promise<void> | Discovery-adjusted from top tracks |
| `databyAllTimeTopArtistsWithDiscovery` | range, discoveryLevel | Promise<void> | Discovery-adjusted from top artists |
| `databyAllTimeTopTracksWithMoodAndDiscovery` | range, mood, discoveryLevel | Promise<void> | Combined, using top tracks |
| `databyAllTimeTopArtistsWithMoodAndDiscovery` | range, mood, discoveryLevel | Promise<void> | Combined, using top artists |

### musicDiscoveryHelpers Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getRecommendationsWithMood` | code, moodPreset, seedTracks, seedArtists, limit | Promise<object> | Low-level mood API |
| `getRecommendationsWithDiscoverySlider` | code, discoveryLevel, seedTracks, seedArtists, audioFeatures, limit | Promise<object> | Low-level discovery API |
| `getRecommendationsWithMoodAndDiscovery` | code, moodPreset, discoveryLevel, seedTracks, seedArtists, limit | Promise<object> | Low-level combined API |
| `getAudioFeatures` | code, trackIds | Promise<array> | Get audio features for tracks |
| `calculateAverageAudioFeatures` | audioFeaturesArray | object | Calculate average features |

---

## Questions or Issues?

If you encounter any issues or have questions about these features:
1. Check the console for error messages
2. Verify your Spotify API token is valid
3. Ensure seed tracks/artists exist and are accessible
4. Review this documentation for correct usage

Happy discovering! 🎵
