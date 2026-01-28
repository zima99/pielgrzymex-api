require('dotenv').config(); // Ładuje zmienne środowiskowe (MONGO_URI)
const mongoose = require('mongoose');
const Trip = require('./models/trip.model');
const Location = require('./models/location.model');

// --- BAZA DANYCH DO GENEROWANIA ---

const images = [
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1768463852068-cc277b8baf35?q=80&w=1170&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1768325400062-2b63fec226c3?q=80&w=1175&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1768590342558-665aa861ed81?q=80&w=1170&auto=format&fit=crop&w=800&q=80'
];

// Miasta Polskie (Start i Cel)
const polishCities = [
  { name: 'Warszawa', lat: 52.2297, lng: 21.0122, country: 'Polska' },
  { name: 'Kraków', lat: 50.0647, lng: 19.9450, country: 'Polska' },
  { name: 'Gdańsk', lat: 54.3520, lng: 18.6466, country: 'Polska' },
  { name: 'Poznań', lat: 52.4064, lng: 16.9252, country: 'Polska' },
  { name: 'Wrocław', lat: 51.1079, lng: 17.0385, country: 'Polska' },
  { name: 'Częstochowa', lat: 50.8118, lng: 19.1203, country: 'Polska' },
  { name: 'Zakopane', lat: 49.2992, lng: 19.9496, country: 'Polska' },
  { name: 'Licheń Stary', lat: 52.3236, lng: 18.3551, country: 'Polska' },
  { name: 'Gniezno', lat: 52.5348, lng: 17.5826, country: 'Polska' },
  { name: 'Lublin', lat: 51.2465, lng: 22.5684, country: 'Polska' }
];

// Miasta Zagraniczne (Tylko Cel)
const foreignCities = [
  { name: 'Rzym', lat: 41.9028, lng: 12.4964, country: 'Włochy' },
  { name: 'Fatima', lat: 39.6172, lng: -8.6521, country: 'Portugalia' },
  { name: 'Lourdes', lat: 43.0915, lng: -0.0457, country: 'Francja' },
  { name: 'Jerozolima', lat: 31.7683, lng: 35.2137, country: 'Izrael' },
  { name: 'Santiago de Compostela', lat: 42.8782, lng: -8.5448, country: 'Hiszpania' },
  { name: 'Medyjugorie', lat: 43.1932, lng: 17.6766, country: 'Bośnia i Hercegowina' },
  { name: 'Wilno', lat: 54.6872, lng: 25.2797, country: 'Litwa' },
  { name: 'Asyż', lat: 43.0707, lng: 12.6196, country: 'Włochy' }
];

const types = ['autokarowa', 'samolotowa', 'piesza', 'rowerowa', 'inna'];
const categoriesList = ['Młodzieżowa', 'Rodzinna', 'Dla dorosłych', 'Stanowa', 'Męska', 'Kobieca'];

const descriptionsParts = [
  "Niezapomniana podróż do korzeni wiary.",
  "Wspaniała okazja do duchowego wyciszenia i modlitwy.",
  "Opieka doświadczonego pilota oraz duszpasterza.",
  "Codzienna Eucharystia w wyjątkowych miejscach kultu.",
  "Zwiedzanie najważniejszych zabytków sakralnych regionu.",
  "Noclegi w komfortowych hotelach z pełnym wyżywieniem.",
  "Możliwość integracji ze wspólnotą i nawiązania nowych przyjaźni.",
  "Program dostosowany do możliwości fizycznych uczestników.",
  "W cenie ubezpieczenie oraz wszystkie opłaty klimatyczne.",
  "Przejazd komfortowym autokarem klasy LUX lub przelot rejsowy."
];

// --- FUNKCJE POMOCNICZE ---

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDescription() {
  // Losujemy 3 do 5 zdań
  const count = getRandomInt(3, 5);
  const shuffled = descriptionsParts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join(' ');
}

function getRandomDate(startOffsetDays, durationDays) {
  const start = new Date();
  start.setDate(start.getDate() + startOffsetDays);
  
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  
  return { start, end };
}

// --- GŁÓWNA LOGIKA ---

const seedDB = async () => {
  try {
    console.log('🔌 Łączenie z bazą danych...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Połączono.');

    // 1. CZYSZCZENIE BAZY
    console.log('🗑️ Usuwanie starych danych...');
    await Trip.deleteMany({});
    await Location.deleteMany({});

    const tripsToInsert = [];
    const locationsToInsert = new Map(); // Używamy Map, żeby nie dublować miast

    // 2. GENEROWANIE 50 WYCIECZEK
    console.log('🏭 Generowanie 70 nowych pielgrzymek...');
    
    for (let i = 0; i < 70; i++) {
      // Losujemy start (zawsze Polska)
      const startCity = getRandomElement(polishCities);
      
      // Losujemy cel (50% szans na Polskę, 50% na Zagranicę)
      const isForeign = Math.random() > 0.5;
      const destCity = isForeign ? getRandomElement(foreignCities) : getRandomElement(polishCities);

      // Zapobiegamy wycieczce z Warszawy do Warszawy
      if (startCity.name === destCity.name) {
        i--; continue;
      }

      // Dodajemy lokalizacje do mapy (jeśli jeszcze ich nie ma)
      locationsToInsert.set(startCity.name, { name: startCity.name, lat: startCity.lat, lng: startCity.lng });
      locationsToInsert.set(destCity.name, { name: destCity.name, lat: destCity.lat, lng: destCity.lng });

      // Daty
      const duration = getRandomInt(2, 14);
      const daysUntilStart = getRandomInt(5, 180); // Wyjazdy od za 5 dni do pół roku
      const { start, end } = getRandomDate(daysUntilStart, duration);

      // Budowanie obiektu
      const trip = {
        name: `Pielgrzymka do: ${destCity.name}`,
        type: getRandomElement(types),
        description: generateDescription(),
        price: getRandomInt(200, 5000), // Ceny od 200 do 5000 zł
        startDate: start,
        endDate: end,
        startLocation: startCity.name,
        destination: destCity.name,
        country: destCity.country, // 👈 WAŻNE dla filtrów!
        placesCount: getRandomInt(0, 55), // 0 to wyprzedane
        categories: [getRandomElement(categoriesList), getRandomElement(categoriesList)], // 2 losowe kategorie
        imageUrl: getRandomElement(images),
        spots: 55 // Maks miejsc
      };

      tripsToInsert.push(trip);
    }

    // 3. ZAPIS DO BAZY
    await Trip.insertMany(tripsToInsert);
    console.log(`✅ Dodano ${tripsToInsert.length} pielgrzymek.`);

    // Zapis lokalizacji dla mapy
    const locsArray = Array.from(locationsToInsert.values());
    await Location.insertMany(locsArray);
    console.log(`✅ Dodano ${locsArray.length} punktów na mapie.`);

    console.log('🎉 ZAKOŃCZONO SUKCESEM!');
    process.exit();

  } catch (err) {
    console.error('❌ Błąd:', err);
    process.exit(1);
  }
};

seedDB();