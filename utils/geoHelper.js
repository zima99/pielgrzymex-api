const Location = require('../models/location.model');
const axios = require('axios');

// Ściąga (dla szybkości) - tutaj też możemy dopisać kraje ręcznie
const STATIC_LOCATIONS = {
  'Warszawa': { lat: 52.2297, lng: 21.0122, country: 'Polska' },
  'Kraków': { lat: 50.0647, lng: 19.9450, country: 'Polska' },
  'Częstochowa': { lat: 50.8118, lng: 19.1203, country: 'Polska' },
  'Rzym': { lat: 41.9028, lng: 12.4964, country: 'Włochy' },
  'Fatima': { lat: 39.6172, lng: -8.6521, country: 'Portugalia' },
  'Jerozolima': { lat: 31.7683, lng: 35.2137, country: 'Izrael' },
  'Lourdes': { lat: 43.0915, lng: -0.0457, country: 'Francja' },
  'Wilno': { lat: 54.6872, lng: 25.2797, country: 'Litwa' },
  'Medyjugorie': { lat: 43.1932, lng: 17.6766, country: 'Bośnia i Hercegowina' }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Zmieniamy nazwę funkcji, bo teraz robi więcej niż tylko zapis do DB
async function getGeoData(city) {
  if (!city) return null;
  const cleanCity = city.trim();

  try {
    // 1. Sprawdź ściągę
    if (STATIC_LOCATIONS[cleanCity]) {
      return STATIC_LOCATIONS[cleanCity];
    }

    // 2. Zapytaj API (dodajemy parametr addressdetails=1)
    console.log(`🌍 [GeoHelper] Pobieram dane dla: ${cleanCity}`);
    await delay(1000); 
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCity)}&addressdetails=1&accept-language=pl`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'Pielgrzymex-App' } });

    if (response.data && response.data.length > 0) {
      const data = response.data[0];
      
      // Zapisujemy przy okazji do tabeli Locations (dla mapy) - jeśli nie ma
      const exists = await Location.findOne({ name: cleanCity });
      if (!exists) {
         await Location.create({
            name: cleanCity,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon)
         });
      }

      // Zwracamy dane, w tym KRAJ
      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        country: data.address ? data.address.country : 'Nieznany'
      };
    }
  } catch (error) {
    console.error(`⚠️ [GeoHelper] Błąd dla ${cleanCity}:`, error.message);
  }
  return null;
}

module.exports = { getGeoData };