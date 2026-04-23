const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    pickup:     { type: pointSchema, required: true },
    drop:       { type: pointSchema, required: true },
    weight:     { type: Number, default: 0 },
    truckType:  { type: String, default: "Small Truck" },
    status: {
      type: String,
      enum: ["Created", "In Transit", "Paused", "Delivered"],
      default: "Created"
    },
    location:   { type: pointSchema, required: true },
    history:    { type: [pointSchema], default: [] },
    route:      { type: [pointSchema], default: [] },
    routeIndex: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);