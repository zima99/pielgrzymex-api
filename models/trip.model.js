const mongoose = require('mongoose');

const tripSchema = mongoose.Schema({
  name: { type: String, required: true },
  startLocation: { type: String, required: true },
  destination: { type: String, required: true },
  country: { type: String, default: 'Polska' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true }, // np. autokarowa, samolotowa
  spots: { type: Number, required: true, default: 50 },
  description: { type: String },
  categories: [{ type: String }], // np. ['Młodzieżowa', 'Rodzinna']
  
  // 👇 TEGO BRAKOWAŁO:
  imageUrl: { type: String } 
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);