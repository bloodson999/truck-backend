const axios = require("axios");

function fallback(start, end, steps = 50000) {
  const arr = [];
  for (let i = 0; i <= steps; i++) {
    arr.push({
      lat: start.lat + ((end.lat - start.lat) * i) / steps,
      lng: start.lng + ((end.lng - start.lng) * i) / steps
    });
  }
  return arr;
}

function sampleRoute(coords, maxPoints = 5000) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const sampled = coords.filter((_, i) => i % step === 0);
  const last = coords[coords.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

async function getRoute(start, end) {
  if (
    !start || !end ||
    typeof start.lat !== "number" || typeof start.lng !== "number" ||
    typeof end.lat !== "number" || typeof end.lng !== "number"
  ) {
    throw new Error("Invalid coordinates passed to getRoute");
  }

  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      `${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const res = await axios.get(url, { timeout: 10000 });
    const coords = res.data.routes[0].geometry.coordinates;
    const points = coords.map(c => ({ lat: c[1], lng: c[0] }));
    console.log(`✅ OSRM route: ${points.length} raw points → sampled to 5000`);
    return sampleRoute(points, 5000);
  } catch (err) {
    console.log("⚠️ OSRM failed, using straight line fallback (50000 steps)");
    return fallback(start, end, 50000);
  }
}

module.exports = getRoute;