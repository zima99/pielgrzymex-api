const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trip = require('./models/trip.model'); // Upewnij się, że ścieżka do modelu jest poprawna

// Ładujemy zmienne środowiskowe (żeby mieć dostęp do bazy danych)
dotenv.config();

// Połączenie z bazą
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Połączono z MongoDB'))
  .catch((err) => {
    console.error('❌ Błąd połączenia:', err);
    process.exit(1);
  });

// DANE DO GENEROWANIA LOSOWYCH NAZW
const prefixes = ['Śladami', 'Sanktuaria', 'Tajemnice', 'Duchowa Podróż do', 'Wyprawa do', 'Weekend w'];
const places = [
  'Częstochowy', 'Lichenia', 'Gietrzwałdu', 'Rzymu', 'Fatimy', 
  'Lourdes', 'Ziemi Świętej', 'Santiago de Compostela', 'Asyżu', 'Medyjugorie', 
  'Wilna', 'Krakowa', 'Łagiewnik', 'Wadowic'
];
const transportTypes = ['autokarowa', 'samolotowa', 'piesza', 'rowerowa', 'inna'];
const categoriesList = ['Młodzieżowa', 'Dla dorosłych', 'Rodzinna', 'Dla seniorów', 'Stanowa'];

// Funkcja generująca losową liczbę
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const importData = async () => {
  try {
    // Opcjonalnie: Wyczyść stare dane (odkomentuj jeśli chcesz usunąć obecne pielgrzymki przed dodaniem nowych)
    // await Trip.deleteMany();
    // console.log('🗑️ Wyczyszczono stare dane...');

    const trips = [];

    for (let i = 0; i < 50; i++) {
      const type = transportTypes[randomInt(0, transportTypes.length - 1)];
      const place = places[randomInt(0, places.length - 1)];
      
      // Generowanie dat (przyszłość)
      const start = new Date();
      start.setDate(start.getDate() + randomInt(10, 365)); // Za 10-365 dni
      const end = new Date(start);
      end.setDate(end.getDate() + randomInt(3, 14)); // Czas trwania 3-14 dni

      // Losowe zdjęcie z internetu (Lorem Picsum)
      // Dodajemy losowy parametr ?random=... żeby zdjęcia były różne
      const imageUrl = `https://picsum.photos/800/600?random=${i}`;

      const trip = {
        name: `${prefixes[randomInt(0, prefixes.length - 1)]} ${place}`,
        startLocation: 'Warszawa', // Możesz też losować miasta
        destination: place.replace('Częstochowy', 'Częstochowa').replace('Rzymu', 'Rzym').replace('Lichenia', 'Licheń'), // Prosta korekta gramatyczna (nieidealna, ale wystarczy)
        startDate: start,
        endDate: end,
        price: randomInt(400, 5000),
        type: type,
        spots: randomInt(20, 60),
        description: `Zapraszamy na wyjątkową pielgrzymkę. To będzie niezapomniany czas modlitwy i zwiedzania. Zapewniamy opiekę duszpasterza i przewodnika.`,
        categories: [
          categoriesList[randomInt(0, categoriesList.length - 1)],
          categoriesList[randomInt(0, categoriesList.length - 1)]
        ],
        imageUrl: imageUrl
      };

      trips.push(trip);
    }

    await Trip.insertMany(trips);
    console.log('✅ Dodano 50 losowych pielgrzymek!');
    process.exit();
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
};

importData();