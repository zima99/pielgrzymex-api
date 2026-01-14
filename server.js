require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- KONFIGURACJA CORS ---
// Pozwala frontendowi (GitHub Pages) łączyć się z backendem
app.use(cors());

// Pozwala serwerowi czytać dane JSON (niezbędne do formularzy)
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);

// --- POŁĄCZENIE Z BAZĄ DANYCH ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Połączono z MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia z bazą:', err));

// --- TRASY (ROUTES) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 1. Trasa Testowa (żeby sprawdzić czy serwer żyje)
app.get('/api/test', (req, res) => {
  res.send('Serwer działa poprawnie! Wersja 2.0');
});

// 2. Trasy Autoryzacji (Rejestracja i Logowanie)
// To mówi: "wszystko co zaczyna się od /api/auth, wyślij do pliku auth.js"
app.use('/api/auth', authRoutes);

// 3. Trasa Pielgrzymek (Prosty model dla mapy, jeśli jeszcze nie masz osobnego pliku)
const pilgrimageSchema = new mongoose.Schema({
  name: String, description: String, location: { lat: Number, lng: Number }, date: Date, price: Number
});
const Pilgrimage = mongoose.models.Pilgrimage || mongoose.model('Pilgrimage', pilgrimageSchema);

app.get('/api/pielgrzymki', async (req, res) => {
  try {
    const pilgrimages = await Pilgrimage.find();
    res.json(pilgrimages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- START SERWERA ---
app.listen(PORT, () => {
  console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`);
});