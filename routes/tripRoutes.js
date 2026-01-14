const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.model');

// POBIERZ WSZYSTKIE PIELGRZYMKI (DLA KAŻDEGO)
// GET /api/trips
router.get('/', async (req, res) => {
  try {
    // Pobieramy wszystkie, sortujemy od najbliższej daty (startDate: 1)
    const trips = await Trip.find({}).sort({ startDate: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania pielgrzymek' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ message: 'Nie znaleziono' });
    }
  } catch (error) {
    console.error(error); // Warto dodać logowanie błędu
    res.status(500).json({ message: 'Błąd serwera' });
  }
});
module.exports = router;