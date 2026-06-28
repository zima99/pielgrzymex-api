const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.model');
const auth = require('../middleware/authMiddleware'); // 👈 Import Twojego middleware autoryzacji

// POBIERZ OFERTY NALEŻĄCE TYLKO DO ZALOGOWANEGO KONTA PREMIUM
// GET /api/trips/my-offers
router.get('/my-offers', auth, async (req, res) => {
  try {
    // Filtrujemy po ID zalogowanego użytkownika przekazanym z middleware auth
    const trips = await Trip.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    return res.json(trips);
  } catch (error) {
    console.error('Błąd pobierania ofert użytkownika:', error);
    return res.status(500).json({ message: 'Błąd pobierania Twoich pielgrzymek' });
  }
});

// POBIERZ WSZYSTKIE PIELGRZYMKI (DLA KAŻDEGO)
// GET /api/trips
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({}).sort({ startDate: 1 });
    return res.json(trips);
  } catch (error) {
    return res.status(500).json({ message: 'Błąd pobierania pielgrzymek' });
  }
});

// POBIERZ JEDNĄ PIELGRZYMKĘ PO ID
// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) {
      return res.json(trip);
    } else {
      return res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

// UTWÓRZ NOWĄ OFERTĘ (DLA KONT PREMIUM / ADMINA)
// POST /api/trips
router.post('/', auth, async (req, res) => {
  try {
    // Przypisujemy ID zalogowanego użytkownika bezpośrednio jako organizatora
    const tripData = {
      ...req.body,
      organizer: req.user._id
    };

    const newTrip = await Trip.create(tripData);
    return res.status(201).json(newTrip);
  } catch (error) {
    console.error('Błąd dodawania wycieczki do bazy:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas dodawania oferty', error: error.message });
  }
});

module.exports = router;