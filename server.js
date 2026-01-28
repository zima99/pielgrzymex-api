require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- IMPORTY TRAS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const tripRoutes = require('./routes/tripRoutes');
// Usunięto zduplikowaną linię authRoutes, która powodowała błąd
const locationRoutes = require('./routes/locationRoutes');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- KONFIGURACJA MIDDLEWARE ---
app.use(cors()); // Pozwala frontendowi łączyć się z backendem
app.use(express.json()); // Pozwala serwerowi czytać JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Udostępnianie zdjęć

// --- PODPIĘCIE TRAS (ROUTES) ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes); // Nasza nowa trasa profilu

// --- POŁĄCZENIE Z BAZĄ DANYCH ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Połączono z MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia z bazą:', err));

// --- INNE TRASY ---

// 1. Trasa Testowa
app.get('/api/test', (req, res) => {
  res.send('Serwer działa poprawnie! Wersja 2.0');
});

// 2. Trasa Pielgrzymek (Legacy/Mapa)
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