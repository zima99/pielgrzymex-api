const express = require('express');
const router = express.Router();
const Location = require('../models/location.model');

router.get('/', async (req, res) => {
  try {
    // Pobierz WSZYSTKIE lokalizacje z bazy
    const locations = await Location.find({});
    
    // Przerób na format mapy: { "Warszawa": {lat:..., lng:...} }
    const responseMap = {};
    locations.forEach(loc => {
      responseMap[loc.name] = { lat: loc.lat, lng: loc.lng };
    });

    // Wyślij gotowca
    res.json(responseMap);
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania lokalizacji' });
  }
});

module.exports = router;