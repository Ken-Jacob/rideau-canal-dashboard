// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { CosmosClient } = require("@azure/cosmos");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// Cosmos DB client setup
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const dbName = process.env.COSMOS_DB_NAME || "RideauCanalDB";
const containerName =
  process.env.COSMOS_CONTAINER_NAME || "SensorAggregations";

if (!endpoint || !key) {
  console.warn(
    "⚠️  COSMOS_ENDPOINT or COSMOS_KEY not set. API routes will fail until .env is configured."
  );
}

const client = new CosmosClient({ endpoint, key });
const db = client.database(dbName);
const container = db.container(containerName);

// The three locations we care about
const LOCATIONS = ["Dow's Lake", "Fifth Avenue", "NAC"];

/**
 * GET /api/latest
 * Returns the latest aggregation document for each location
 */
app.get("/api/latest", async (req, res) => {
  try {
    const latestPerLocation = [];

    const queryText =
      "SELECT TOP 1 * FROM c WHERE c.location = @location ORDER BY c.windowEnd DESC";

    for (const loc of LOCATIONS) {
      const querySpec = {
        query: queryText,
        parameters: [{ name: "@location", value: loc }],
      };

      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length > 0) {
        latestPerLocation.push(resources[0]);
      }
    }

    res.json({ locations: latestPerLocation });
  } catch (err) {
    console.error("Error in /api/latest:", err.message || err);
    res.status(500).json({ error: "Failed to fetch latest data." });
  }
});

/**
 * GET /api/history
 * Returns last 60 minutes of data (all locations)
 */
app.get("/api/history", async (req, res) => {
  try {
    // Cosmos SQL supports GetCurrentDateTime and DateTimeAdd
    const querySpec = {
      query: `
        SELECT
          c.location,
          c.windowEnd,
          c.avgIceThickness,
          c.avgSurfaceTemp,
          c.safetyStatus
        FROM c
        WHERE c.windowEnd >= DateTimeAdd("minute", -60, GetCurrentDateTime())
        ORDER BY c.windowEnd ASC
      `,
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    res.json({ points: resources });
  } catch (err) {
    console.error("Error in /api/history:", err.message || err);
    res.status(500).json({ error: "Failed to fetch history data." });
  }
});

// Root: send index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Rideau Canal dashboard server running on port ${port}`);
});
