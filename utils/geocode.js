const axios = require("axios");

async function geocode(place) {
  if (!place || !String(place).trim()) {
    throw new Error("Place is required");
  }

  const res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: { format: "json", limit: 1, q: String(place).trim() },
    headers: { "User-Agent": "truckflow-app/1.0" },
    timeout: 10000
  });

  if (!Array.isArray(res.data) || res.data.length === 0) {
    throw new Error(`Location not found: "${place}"`);
  }

  const result = {
    lat: Number(res.data[0].lat),
    lng: Number(res.data[0].lon)
  };

  console.log(`📍 Geocoded "${place}" → ${result.lat}, ${result.lng}`);
  return result;
}

module.exports = geocode;