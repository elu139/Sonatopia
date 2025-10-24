import React, { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import spotifyHelpers from "../spotifyHelpers";

const NetworkGraph = ({ spotiData }) => {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const buildGraph = async () => {
      if (!spotiData || !spotiData.seeds || !spotiData.tracks) {
        setLoading(false);
        return;
      }

      try {
        // Extract seed artist IDs from the seeds array
        const seedArtistIds = spotiData.seeds
          .filter((seed) => seed.type === "artist")
          .map((seed) => seed.id);

        // If no artist seeds, try to use track seeds
        if (seedArtistIds.length === 0) {
          const seedTrackIds = spotiData.seeds
            .filter((seed) => seed.type === "track")
            .map((seed) => seed.id);

          // For track seeds, extract artists from those tracks
          if (seedTrackIds.length > 0 && spotiData.tracks.length > 0) {
            // Get first few tracks to extract seed artists
            const artistsFromSeeds = spotifyHelpers.extractArtistsFromTracks(
              spotiData.tracks.slice(0, 5)
            );
            seedArtistIds.push(...artistsFromSeeds.map((a) => a.id));
          }
        }

        // Build the network graph
        const graph = await spotifyHelpers.buildNetworkGraph(
          seedArtistIds,
          spotiData.tracks
        );

        // Calculate positioning
        const enhancedGraph = spotifyHelpers.calculateRecommendationPositions(
          graph,
          seedArtistIds
        );

        setGraphData(enhancedGraph);
        setLoading(false);
      } catch (error) {
        console.error("Error building network graph:", error);
        setLoading(false);
      }
    };

    buildGraph();
  }, [spotiData]);

  // Node color based on type and distance
  const getNodeColor = (node) => {
    if (node.type === "seed") return "#1DB954"; // Spotify green for seed artists
    if (node.type === "related") return "#B49BC8"; // Purple for related artists

    // Color recommendations by distance
    const distance = node.distance || Infinity;
    if (distance === 1) return "#1ED760"; // Close recommendations - bright green
    if (distance === 2) return "#FFD700"; // Medium distance - gold
    if (distance === 3) return "#FF8C00"; // Further - orange
    return "#FF4500"; // Far - red-orange
  };

  // Node size based on popularity
  const getNodeSize = (node) => {
    if (node.type === "seed") return 8;
    const baseSize = 4;
    const popularityFactor = (node.popularity || 50) / 100;
    return baseSize + popularityFactor * 4;
  };

  // Handle node click
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    // Open Spotify artist page
    if (node.id) {
      window.open(`https://open.spotify.com/artist/${node.id}`, "_blank");
    }
  };

  // Handle node hover
  const handleNodeHover = (node) => {
    setHoveredNode(node);
    if (graphRef.current) {
      const canvas = graphRef.current;
      canvas.style.cursor = node ? "pointer" : "default";
    }
  };

  // Custom node canvas rendering with labels
  const drawNode = (node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = node.type === "seed" ? 14 / globalScale : 12 / globalScale;
    const nodeSize = getNodeSize(node);
    const color = getNodeColor(node);

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Add border for seed nodes
    if (node.type === "seed") {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label for seed nodes and hovered/selected nodes
    if (node.type === "seed" || hoveredNode === node || selectedNode === node) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF";

      // Add background for better readability
      const textWidth = ctx.measureText(label).width;
      const padding = 4 / globalScale;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(
        node.x - textWidth / 2 - padding,
        node.y + nodeSize + 5 / globalScale - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, node.x, node.y + nodeSize + fontSize / 2 + 5 / globalScale);
    }
  };

  // Link color and width
  const getLinkColor = (link) => {
    return link.type === "related"
      ? "rgba(180, 155, 200, 0.4)" // Purple for related links
      : "rgba(255, 255, 255, 0.2)"; // White for recommendation links
  };

  const getLinkWidth = (link) => {
    return link.type === "related" ? 2 : 1;
  };

  if (loading) {
    return (
      <div className="network-graph-loading">
        <div className="loading-spinner"></div>
        <p>Building your music network...</p>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="network-graph-empty">
        <p>No network data available. Please generate recommendations first.</p>
      </div>
    );
  }

  return (
    <div className="network-graph-container">
      <div className="network-graph-header">
        <h2>Your Music Network</h2>
        <div className="network-legend">
          <div className="legend-item">
            <span className="legend-color seed"></span>
            <span>Your Top Artists</span>
          </div>
          <div className="legend-item">
            <span className="legend-color related"></span>
            <span>Related Artists</span>
          </div>
          <div className="legend-item">
            <span className="legend-color rec-close"></span>
            <span>Close Recommendations</span>
          </div>
          <div className="legend-item">
            <span className="legend-color rec-far"></span>
            <span>Distant Recommendations</span>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="node-info-panel">
          <h3>{selectedNode.name}</h3>
          <p className="node-type">
            {selectedNode.type === "seed" && "Your Top Artist"}
            {selectedNode.type === "related" && "Related Artist"}
            {selectedNode.type === "recommendation" && (
              <>
                Recommendation
                {selectedNode.closestSeedName && (
                  <span className="closest-seed">
                    {" "}
                    (close to {selectedNode.closestSeedName})
                  </span>
                )}
              </>
            )}
          </p>
          <p className="node-popularity">
            Popularity: {selectedNode.popularity || "N/A"}
          </p>
          {selectedNode.genres && selectedNode.genres.length > 0 && (
            <p className="node-genres">
              Genres: {selectedNode.genres.slice(0, 3).join(", ")}
            </p>
          )}
          {selectedNode.distance !== undefined && selectedNode.distance > 0 && (
            <p className="node-distance">
              Distance from your taste: {selectedNode.distance} step
              {selectedNode.distance !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node) => {
          let label = node.name;
          if (node.closestSeedName && node.type === "recommendation") {
            label += ` (close to ${node.closestSeedName})`;
          }
          if (node.popularity) {
            label += ` - Popularity: ${node.popularity}`;
          }
          return label;
        }}
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        nodeCanvasObject={drawNode}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link) => (link.type === "related" ? 2 : 1)}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        warmupTicks={50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      <div className="network-graph-info">
        <p>
          Showing {graphData.nodes.length} artists with{" "}
          {graphData.links.length} connections
        </p>
        <p className="graph-hint">
          Click on an artist to view on Spotify • Drag to rearrange • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default NetworkGraph;
