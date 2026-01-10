const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// !!! WAŻNE: Podmień <password> na swoje hasło !!!
const MONGO_URI ='mongodb+srv://admin:admin123@pielgrzymex.eb8hj85.mongodb.net/?appName=pielgrzymex';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Połączono z MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia:', err));

// Schemat ze współrzędnymi
const pilgrimageSchema = new mongoose.Schema({
  title: String,
  country: String,
  image: String,
  price: Number,
  type: String,
  distance: Number,
  featured: Boolean,
  lat: Number, // <--- TO MUSI TU BYĆ
  lng: Number  // <--- I TO
});

const Pilgrimage = mongoose.model('Pilgrimage', pilgrimageSchema);

// Endpoint SEED - czyści i ładuje nowe dane
app.get('/api/seed', async (req, res) => {
  const starterPielgrzymki = [
    { 
      title: 'Jubileusz w Rzymie', country: 'Włochy', price: 3200, type: 'samolot', featured: true,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=400&auto=format&fit=crop',
      lat: 41.9028, lng: 12.4964 
    },
    { 
      title: 'Jasna Góra', country: 'Polska', price: 200, type: 'piesza', featured: true,
      image: 'https://images.unsplash.com/photo-1560419450-a400c2d38526?q=80&w=400&auto=format&fit=crop',
      lat: 50.8118, lng: 19.0970 
    },
    { 
      title: 'Sanktuarium w Licheniu', country: 'Polska', price: 150, type: 'autokar', featured: false,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Bazylika_w_Licheniu_Starym.jpg/640px-Bazylika_w_Licheniu_Starym.jpg',
      lat: 52.3236, lng: 18.3551 
    },
    { 
      title: 'Gietrzwałd', country: 'Polska', price: 300, type: 'rower', featured: true,
      image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=400&auto=format&fit=crop',
      lat: 53.7142, lng: 20.2452 
    },
    { 
      title: 'Kalwaria Zebrzydowska', country: 'Polska', price: 100, type: 'piesza', featured: false,
      image: 'https://images.unsplash.com/photo-1518182170546-0766aa6f7126?q=80&w=400&auto=format&fit=crop',
      lat: 49.8665, lng: 19.6725 
    }
  ];

  try {
    await Pilgrimage.deleteMany({});
    await Pilgrimage.insertMany(starterPielgrzymki);
    res.send('✅ Baza zaktualizowana o współrzędne GPS! Odśwież mapę.');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Pobieranie danych
app.get('/api/pielgrzymki', async (req, res) => {
  const trips = await Pilgrimage.find();
  res.json(trips);
});
// 3. POBIERZ POJEDYNCZĄ PIELGRZYMKĘ (GET /api/pielgrzymki/:id)
// 3. POBIERZ POJEDYNCZĄ PIELGRZYMKĘ - WERSJA ZE "SZPIEGIEM"
app.get('/api/pielgrzymki/:id', async (req, res) => {
  console.log('------------------------------------------------');
  console.log('🔎 SERWER: Ktoś pyta o ID:', req.params.id);
  
  try {
    // Sprawdzamy, czy ID ma poprawny format (24 znaki)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ SERWER: To nie jest poprawne ID MongoDB!');
      return res.status(400).json({ message: 'Błędny format ID' });
    }

    const trip = await Pilgrimage.findById(req.params.id);
    
    if (!trip) {
      console.log('⚠️ SERWER: Szukałem w bazie, ale nic nie znalazłem (NULL).');
      return res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
    }

    console.log('✅ SERWER: Znalazłem!', trip.title);
    res.json(trip);

  } catch (err) {
    console.error('💥 SERWER: Błąd krytyczny:', err.message);
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Serwer backendowy działa na porcie http://localhost:${PORT}`);
});