const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.model');
const Location = require('../models/location.model');
const axios = require('axios'); // Musimy doinstalować axios

// Funkcja pomocnicza: Czekaj X ms (żeby nie zbanowali nas na OpenStreetMap)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

router.get('/', async (req, res) => {
  try {
    // 1. Pobierz wszystkie miasta używane w pielgrzymkach (start i cel)
    const trips = await Trip.find({});
    const neededCities = new Set();
    
    trips.forEach(trip => {
      if (trip.startLocation) neededCities.add(trip.startLocation.trim());
      if (trip.destination) neededCities.add(trip.destination.trim());
    });

    const citiesList = Array.from(neededCities);

    // 2. Pobierz te, które już mamy w bazie
    const existingLocations = await Location.find({ name: { $in: citiesList } });
    const existingNames = existingLocations.map(l => l.name);

    // 3. Znajdź te, których brakuje
    const missingCities = citiesList.filter(city => !existingNames.includes(city));

    // 4. Jeśli czegoś brakuje - pobierz z API (Geocoding) i zapisz
    if (missingCities.length > 0) {
      console.log(`🌍 Brakuje współrzędnych dla: ${missingCities.join(', ')}. Pobieram...`);

      for (const city of missingCities) {
        try {
          // Opóźnienie 1 sekunda między zapytaniami (wymóg Nominatim API)
          await delay(1000); 

          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
          // Ważne: Nominatim wymaga User-Agent
          const response = await axios.get(url, { headers: { 'User-Agent': 'Pielgrzymex-App' } });

          if (response.data && response.data.length > 0) {
            const newLoc = new Location({
              name: city,
              lat: parseFloat(response.data[0].lat),
              lng: parseFloat(response.data[0].lon)
            });
            await newLoc.save();
            existingLocations.push(newLoc); // Dodaj do listy wynikowej
            console.log(`✅ Zapisano: ${city}`);
          } else {
            console.log(`❌ Nie znaleziono: ${city}`);
          }
        } catch (err) {
          console.error(`Błąd przy mieście ${city}:`, err.message);
        }
      }
    }

    // 5. Zwróć mapę: { "Warszawa": {lat: ..., lng: ...}, "Rzym": ... }
    const responseMap = {};
    existingLocations.forEach(loc => {
      responseMap[loc.name] = { lat: loc.lat, lng: loc.lng };
    });

    res.json(responseMap);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera lokalizacji' });
  }
});

module.exports = router;