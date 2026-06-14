const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Upewnij się, że ścieżka do modelu jest poprawna dla Twojej struktury katalogów
const Trip = require('./models/trip.model'); 

// Wczytanie zmiennych ze środowiska (żeby pobrać MONGO_URI)
dotenv.config();

// --- ZASOBY DO LOSOWANIA ---
const adjectives = ['Wielka', 'Wiosenna', 'Duchowa', 'Piesza', 'Weekendowa', 'Rodzinna', 'Autokarowa', 'Dziękczynna', 'Śladami Świętych'];
const destinations = ['Jasna Góra', 'Lourdes', 'Fatima', 'Rzym', 'Medziugorie', 'Santiago de Compostela', 'Wilno', 'Ziemia Święta', 'Asyż', 'Kalwaria Zebrzydowska', 'Licheń Stary', 'Gietrzwałd'];
const startLocations = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Katowice', 'Ruda Śląska', 'Lublin', 'Rzeszów', 'Białystok'];
const categoriesList = ['Młodzieżowa', 'Dla dorosłych', 'Stanowa', 'Rodzinna', 'Męska', 'Kobieca'];
const types = ['piesza', 'rowerowa', 'autokarowa', 'samolotowa', 'inna'];

// --- FUNKCJE POMOCNICZE ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomCategories = () => {
  const shuffled = [...categoriesList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, randomInt(1, 3)); // Zwraca od 1 do 3 losowych kategorii
};

const generateTrips = async () => {
  try {
    // 1. Połączenie z bazą
    if (!process.env.MONGO_URI) {
      throw new Error('Brak MONGO_URI w pliku .env!');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Połączono z bazą MongoDB');

    // Opcjonalnie: Czyszczenie obecnych pielgrzymek przed dodaniem nowych
    // Odkomentuj poniższą linię, jeśli chcesz skasować stare wycieczki przed generowaniem
    // await Trip.deleteMany({}); 
    // console.log('🗑️ Usunięto stare pielgrzymki');

    const trips = [];
    const today = new Date();

    // 2. Generowanie 70 obiektów
    for (let i = 0; i < 70; i++) {
      const dest = randomItem(destinations);
      const name = `${randomItem(adjectives)} Pielgrzymka: ${dest}`;
      
      // Losowa data rozpoczęcia (od 14 do 365 dni w przód)
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + randomInt(14, 365));
      
      // Losowa data zakończenia (od 2 do 14 dni po dacie startu)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + randomInt(2, 14));

      // Prosta heurystyka dla pola 'country'
      const polishDestinations = ['Jasna Góra', 'Kalwaria Zebrzydowska', 'Licheń Stary', 'Gietrzwałd'];
      const country = polishDestinations.includes(dest) ? 'Polska' : 'Zagranica';

      trips.push({
        name: name,
        type: randomItem(types),
        description: `Zapraszamy na wyjątkową wycieczkę do miejsca jakim jest ${dest}. To doskonała okazja do oderwania się od codzienności, głębokiego wyciszenia oraz zawiązania nowych relacji. Zapewniamy pełną opiekę organizacyjną, komfortowy transport i niezapomniane przeżycia.`,
        price: randomInt(50, 450) * 10, // Cena od 500 do 4500 PLN
        startDate: startDate,
        endDate: endDate,
        startLocation: randomItem(startLocations),
        destination: dest,
        placesCount: randomInt(0, 55), // Jeśli 0, pokaże się jako "Wyprzedane"
        imageUrl: `https://picsum.photos/seed/${randomInt(1, 10000)}/600/400`, // Generator losowych obrazków
        country: country,
        categories: randomCategories()
      });
    }

    // 3. Wrzucenie do bazy danych
    console.log('⏳ Wstawianie 70 pielgrzymek do bazy...');
    await Trip.insertMany(trips);
    
    console.log('✅ Gotowe! Pielgrzymki zostały pomyślnie wygenerowane.');
    process.exit();

  } catch (error) {
    console.error('❌ Błąd podczas generowania:', error);
    process.exit(1);
  }
};

// Uruchomienie
generateTrips();