const mongoose = require('mongoose');

const tripSchema = mongoose.Schema({
  name: { type: String, required: true },
  startLocation: { type: String, required: true },
  destination: { type: String, required: true },
  country: { type: String, default: 'Polska' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true }, // np. autokarowa, samolotowa, piesza itp.
  spots: { type: Number, required: true, default: 50 },
  description: { type: String },
  categories: [{ type: String }], // np. ['Młodzieżowa', 'Rodzinna']
  imageUrl: { type: String },
  
  // 👇 POWIĄZANIE Z ORGANIZATOREM (Konto Premium lub Admin)
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerType: { type: String, enum: ['parafia', 'biuro', ''] },

  // Szczegółowe dane adresowe pod mapy i geokodowanie
  destinationAddress: {
    country: String, city: String, zipCode: String, street: String, number: String,
    lat: { type: Number, default: 52.2297 }, lng: { type: Number, default: 21.0122 }
  },
  startAddress: {
    country: String, city: String, zipCode: String, street: String, number: String,
    lat: { type: Number, default: 52.2297 }, lng: { type: Number, default: 21.0122 }
  },

  // Szczegóły godzinowe i kontaktowe
  startTime: { type: String },
  endTime: { type: String },
  contact: {
    phone: String,
    email: String,
    address: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);