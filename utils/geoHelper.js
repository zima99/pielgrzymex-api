const Location = require('../models/location.model');
const axios = require('axios');

// ŚCIĄGA (Najpopularniejsze miasta - dla prędkości)
const STATIC_LOCATIONS = {
  'Warszawa': { lat: 52.2297, lng: 21.0122 },
  'Kraków': { lat: 50.0647, lng: 19.9450 },
  'Częstochowa': { lat: 50.8118, lng: 19.1203 },
  'Gdańsk': { lat: 54.3520, lng: 18.6466 },
  'Poznań': { lat: 52.4064, lng: 16.9252 },
  'Wrocław': { lat: 51.1079, lng: 17.0385 },
  'Rzym': { lat: 41.9028, lng: 12.4964 },
  'Fatima': { lat: 39.6172, lng: -8.6521 },
  'Lourdes': { lat: 43.0915, lng: -0.0457 },
  'Jerozolima': { lat: 31.7683, lng: 35.2137 },
  'Santiago de Compostela': { lat: 42.8782, lng: -8.5448 },
  'Asyż': { lat: 43.0707, lng: 12.6196 },
  'Medyjugorie': { lat: 43.1932, lng: 17.6766 },
  'Wilno': { lat: 54.6872, lng: 25.2797 },
  'Licheń': { lat: 52.3218, lng: 18.3582 },
  'Gietrzwałd': { lat: 53.7431, lng: 20.2464 },
  'Wadowice': { lat: 49.8833, lng: 19.4929 },
  'Łagiewniki': { lat: 50.0211, lng: 19.9363 }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function saveLocationToDb(city) {
  if (!city) return;
  const cleanCity = city.trim();

  try {
    // 1. Sprawdź czy już jest w bazie (żeby nie dublować)
    const exists = await Location.findOne({ name: cleanCity });
    if (exists) return; // Już mamy, koniec pracy.

    // 2. Sprawdź ściągę statyczną
    if (STATIC_LOCATIONS[cleanCity]) {
      const coords = STATIC_LOCATIONS[cleanCity];
      await Location.create({ name: cleanCity, lat: coords.lat, lng: coords.lng });
      console.log(`⚡ [GeoHelper] Zapisano ze ściągi: ${cleanCity}`);
      return;
    }

    // 3. Jeśli nie ma nigdzie - zapytaj OpenStreetMap
    console.log(`🌍 [GeoHelper] Pobieram z API: ${cleanCity}`);
    await delay(1000); // Kultura dla API
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCity)}`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'Pielgrzymex-App' } });

    if (response.data && response.data.length > 0) {
      await Location.create({
        name: cleanCity,
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      });
      console.log(`✅ [GeoHelper] Zapisano z API: ${cleanCity}`);
    } else {
      console.log(`❌ [GeoHelper] Nie znaleziono miasta: ${cleanCity}`);
    }

  } catch (error) {
    console.error(`⚠️ [GeoHelper] Błąd dla ${cleanCity}:`, error.message);
  }
}

module.exports = { saveLocationToDb };