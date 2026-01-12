require('dotenv').config(); // Musi być na samej górze
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Biblioteka do obsługi zapytań z innej domeny

// Import tras logowania
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- KONFIGURACJA CORS (To naprawia Twój błąd!) ---
app.use(cors());
app.use(express.json());

// --- POŁĄCZENIE Z BAZĄ DANYCH ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Połączono z MongoDB!'))
  .catch(err => {
    console.error('❌ Błąd połączenia z bazą:', err);
    console.error('👉 Sprawdź IP Whitelist na MongoDB Atlas (0.0.0.0/0)');
    console.error('👉 Sprawdź czy hasło w pliku .env/Render nie ma znaków specjalnych (@, :, /)');
  });

// --- MODELE (Jeśli nie masz ich w osobnych plikach) ---
// Model Pielgrzymki (Potrzebny, żeby mapa działała)
const pilgrimageSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: {
    lat: Number,
    lng: Number
  },
  date: Date,
  price: Number,
  imageUrl: String
});
// Sprawdzamy, czy model już istnieje, żeby uniknąć błędu przy restarcie
const Pilgrimage = mongoose.models.Pilgrimage || mongoose.model('Pilgrimage', pilgrimageSchema);


// --- TRASY (ROUTES) ---

// 1. Trasy Autoryzacji (Logowanie/Rejestracja)
app.use('/api/auth', authRoutes);

// 2. Trasa Pielgrzymek (Dla Mapy)
app.get('/api/pielgrzymki', async (req, res) => {
  try {
    const pilgrimages = await Pilgrimage.find();
    res.json(pilgrimages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Seedowanie bazy (Opcjonalne - do szybkiego wypełnienia danymi)
app.get('/api/seed', async (req, res) => {
  try {
    const count = await Pilgrimage.countDocuments();
    if (count > 0) return res.send('Baza już ma dane. Pomijam seedowanie.');

    const sampleData = [
      { name: 'Jasna Góra', description: 'Sanktuarium w Częstochowie', location: { lat: 50.812, lng: 19.097 }, price: 100 },
      { name: 'Licheń', description: 'Bazylika w Licheniu', location: { lat: 52.323, lng: 18.355 }, price: 120 },
      { name: 'Łagiewniki', description: 'Sanktuarium w Krakowie', location: { lat: 50.021, lng: 19.935 }, price: 150 }
    ];
    
    await Pilgrimage.insertMany(sampleData);
    res.send('✅ Baza zaktualizowana przykładowymi danymi!');
  } catch (err) {
    res.status(500).send('Błąd seedowania: ' + err.message);
  }
});

// --- URUCHOMIENIE SERWERA ---
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});