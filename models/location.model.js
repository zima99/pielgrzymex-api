const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Np. "Warszawa"
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

module.exports = mongoose.model('Location', locationSchema);