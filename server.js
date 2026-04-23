require("dotenv").config(); 
const express = require("express");
const cors = require("cors");
const path = require("path");
const geocode = require("./utils/geocode");
const getRoute = require("./utils/routeEngine");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static("public"));

/* -------------------------------
   IN-MEMORY DATABASE
--------------------------------*/
let shipments = {};
let locations = {};
let intervals = {};
let routes = {};
let routeIndex = {};

/* -------------------------------
   SIMPLE ADMIN AUTH
--------------------------------*/
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const adminTokens = new Set();

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}

/* -------------------------------
   PAGE ALIASES
--------------------------------*/
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/tracking", (_req, res) => res.sendFile(path.join(__dirname, "public", "tracking.html")));
app.get("/booking", (_req, res) => res.sendFile(path.join(__dirname, "public", "booking.html")));

/* -------------------------------
   ADMIN ROUTES
--------------------------------*/
app.post("/admin/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "").trim();

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  adminTokens.add(token);
  res.json({ success: true, token });
});

app.get("/admin/me", auth, (_req, res) => {
  res.json({ success: true });
});

app.post("/admin/logout", auth, (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (token) adminTokens.delete(token);
  res.json({ success: true });
});

/* -------------------------------
   CREATE SHIPMENT
--------------------------------*/
app.post("/create", async (req, res) => {
  try {
    const id = "TRK" + Date.now();
    const pickup = String(req.body.pickup || "").trim();
    const drop = String(req.body.drop || "").trim();

    if (!pickup || !drop) {
      return res.status(400).json({ success: false, error: "Pickup and drop are required" });
    }

    const pickupPoint = await geocode(pickup);
    const dropPoint = await geocode(drop);

    // safety check
    if (!pickupPoint || typeof pickupPoint.lat !== "number") {
      return res.status(400).json({ success: false, error: `Could not find location: ${pickup}` });
    }
    if (!dropPoint || typeof dropPoint.lat !== "number") {
      return res.status(400).json({ success: false, error: `Could not find location: ${drop}` });
    }

    const route = await getRoute(pickupPoint, dropPoint);

    shipments[id] = { id, pickup, drop, status: "Created", history: [pickupPoint] };
    locations[id] = pickupPoint;
    routes[id] = route;
    routeIndex[id] = 0;

    console.log(`📦 Created shipment ${id} from ${pickup} to ${drop}`);
    res.json({ success: true, trackingId: id });
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});
/* -------------------------------
   GET SHIPMENT + LOCATION
--------------------------------*/
app.get("/shipment/:id", (req, res) => {
  const id = String(req.params.id || "").trim();

  if (!shipments[id]) {
    return res.status(404).json({ success: false, error: "Not found" });
  }

  res.json({
    success: true,
    shipment: { ...shipments[id], location: locations[id] },
    location: locations[id]
  });
});

/* -------------------------------
   START AUTO MOVEMENT
--------------------------------*/

app.post("/start/:id", auth, (req, res) => {
  const id = String(req.params.id || "").trim();

  if (!shipments[id] || !routes[id] || routes[id].length === 0) {
    return res.status(404).json({ success: false, error: "Invalid ID" });
  }

  // configurable speed
  const TICK_MS = Math.max(1000, Number(process.env.MOVE_TICK_MS || 5000)); // slower: 5s
  const POINT_STEP = Math.max(1, Number(process.env.MOVE_POINT_STEP || 1)); // points per tick

  clearInterval(intervals[id]);
  shipments[id].status = "In Transit";

  intervals[id] = setInterval(() => {
    const path = routes[id];
    let idx = routeIndex[id] ?? 0;

    if (idx >= path.length - 1) {
      clearInterval(intervals[id]);
      shipments[id].status = "Delivered";
      console.log(`📦 ${id} DELIVERED`);
      return;
    }

    idx = Math.min(idx + POINT_STEP, path.length - 1);
    routeIndex[id] = idx;
    locations[id] = path[idx];
    shipments[id].history.push(path[idx]);

    console.log(`🚛 ${id} → ${locations[id].lat.toFixed(4)}, ${locations[id].lng.toFixed(4)}`);

    if (idx >= path.length - 1) {
      clearInterval(intervals[id]);
      shipments[id].status = "Delivered";
      console.log(`📦 ${id} DELIVERED`);
    }
  }, TICK_MS);

  res.json({ success: true, message: "Truck Started" });
});


/* -------------------------------
   STOP MOVEMENT
--------------------------------*/
app.post("/stop/:id", auth, (req, res) => {
  const id = String(req.params.id || "").trim();

  clearInterval(intervals[id]);
  if (shipments[id]) shipments[id].status = "Paused";

  console.log(`⛔ STOP ${id}`);
  res.json({ success: true, message: "Truck Stopped" });
});

/* -------------------------------
   MANUAL LOCATION UPDATE
--------------------------------*/
app.post("/update-location/:id", auth, (req, res) => {
  const id = String(req.params.id || "").trim();
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);

  if (!shipments[id]) {
    return res.status(404).json({ success: false, error: "Invalid ID" });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, error: "Invalid latitude/longitude" });
  }

  locations[id] = { lat, lng };
  shipments[id].history.push({ lat, lng });

  res.json({ success: true, message: "Location Updated" });
});

/* -------------------------------
   TEST ROUTE
--------------------------------*/
app.get("/test", (_req, res) => {
  res.send("Server is working");
});

/* -------------------------------
   SERVER
--------------------------------*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});