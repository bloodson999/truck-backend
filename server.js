const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SERVE FRONTEND FILES (ADD THIS)
app.use(express.static("public"));

/* -------------------------------
   IN-MEMORY DATABASE
--------------------------------*/
let shipments = {};
let locations = {};
let intervals = {};

/* -------------------------------
   CREATE SHIPMENT
--------------------------------*/
app.post("/create", (req, res) => {
  const id = "TRK" + Date.now();

  shipments[id] = {
    id,
    pickup: req.body.pickup || "Unknown",
    drop: req.body.drop || "Unknown",
    status: "Created"
  };

  // default start = Texas
  locations[id] = { lat: 31.0, lng: -99.0 };

  console.log(`📦 Created shipment ${id}`);

  res.json({ success: true, trackingId: id });
});

/* -------------------------------
   GET SHIPMENT + LOCATION
--------------------------------*/
app.get("/shipment/:id", (req, res) => {
  const id = req.params.id;

  if (!shipments[id]) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    shipment: shipments[id],
    location: locations[id]
  });
});

/* -------------------------------
   START AUTO MOVEMENT
--------------------------------*/
app.post("/start/:id", (req, res) => {
  const id = req.params.id;

  if (!locations[id]) {
    return res.status(404).json({ error: "Invalid ID" });
  }

  console.log(`▶ START ${id}`);

  const target = { lat: 34.0, lng: -118.2 }; // Los Angeles

  clearInterval(intervals[id]);

  intervals[id] = setInterval(() => {
    let current = locations[id];

    if (
      Math.abs(current.lat - target.lat) < 0.1 &&
      Math.abs(current.lng - target.lng) < 0.1
    ) {
      clearInterval(intervals[id]);
      shipments[id].status = "Delivered";

      console.log(`📦 ${id} DELIVERED`);
      return;
    }

    current.lat += (target.lat - current.lat) * 0.02;
    current.lng += (target.lng - current.lng) * 0.02;

    locations[id] = current;

    console.log(
      `🚛 ${id} → ${current.lat.toFixed(3)}, ${current.lng.toFixed(3)}`
    );
  }, 1000);

  shipments[id].status = "In Transit";

  res.json({ success: true, message: "Truck Started" });
});

/* -------------------------------
   STOP MOVEMENT
--------------------------------*/
app.post("/stop/:id", (req, res) => {
  const id = req.params.id;

  clearInterval(intervals[id]);
  shipments[id].status = "Paused";

  console.log(`⛔ STOP ${id}`);

  res.json({ success: true, message: "Truck Stopped" });
});

/* -------------------------------
   SERVER
--------------------------------*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.get("/test", (req, res) => {
  res.send("Server is working");
});