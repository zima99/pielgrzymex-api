const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder docelowy
  },
  filename: (req, file, cb) => {
    // Unikalna nazwa pliku: data + oryginał
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// ==========================================
// UŻYTKOWNICY
// ==========================================

// 1. POBIERZ WSZYSTKICH
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// --- 2. POBIERZ JEDNEGO USERA (TEGO BRAKUJE!) ---
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// 3. DODAJ USERA
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, isPremium } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Użytkownik istnieje' });

    const user = await User.create({
      firstName, lastName, email, password,
      role: role || 'user',
      isPremium: isPremium || false
    });

    if (user) res.status(201).json(user);
    else res.status(400).json({ message: 'Błąd danych' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera: ' + error.message });
  }
});

// 4. EDYTUJ USERA
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      if (req.body.role) user.role = req.body.role;
      if (req.body.isPremium !== undefined) user.isPremium = req.body.isPremium;
      if (req.body.password) user.password = req.body.password;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd edycji' });
  }
});

// 5. USUŃ USERA
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'Usunięto' });
    } else {
      res.status(404).json({ message: 'Nie znaleziono' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd usuwania' });
  }
});

router.get('/trips', protect, admin, async (req, res) => {
  try {
    const trips = await Trip.find({}).sort({ _id: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania' });
  }
});

// 7. POBIERZ JEDNĄ (Bez zmian)
router.get('/trips/:id', protect, admin, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) res.json(trip);
    else res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// 8. DODAJ PIELGRZYMKĘ (Z UPLOADEM)
// Dodajemy middleware: upload.single('image')
router.post('/trips', protect, admin, upload.single('image'), async (req, res) => {
  try {
    // Dane tekstowe przyjdą w req.body
    // Plik przyjdzie w req.file
    
    // Parsowanie kategorii (bo FormData przesyła tablice jako tekst)
    let categories = [];
    if (req.body.categories) {
      try {
        categories = JSON.parse(req.body.categories);
      } catch (e) {
        categories = [req.body.categories];
      }
    }

    // Budowanie ścieżki do zdjęcia (jeśli przesłano)
    // UWAGA: Dopasuj 'http://localhost:3000' do swojego adresu
    const imageUrl = req.file 
      ? `http://pielgrzymex-api.onrender.com/${req.file.filename}` 
      : '';

    const trip = await Trip.create({
      name: req.body.name,
      startLocation: req.body.startLocation,
      destination: req.body.destination,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      price: req.body.price,
      type: req.body.type,
      spots: req.body.spots || 50,
      description: req.body.description || '',
      categories: categories,
      imageUrl: imageUrl // 👈 Zapisujemy link do pliku
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd dodawania: ' + error.message });
  }
});

// 9. EDYTUJ PIELGRZYMKĘ (Z UPLOADEM)
router.put('/trips/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) {
      // Aktualizacja pól tekstowych
      trip.name = req.body.name || trip.name;
      trip.startLocation = req.body.startLocation || trip.startLocation;
      trip.destination = req.body.destination || trip.destination;
      trip.startDate = req.body.startDate || trip.startDate;
      trip.endDate = req.body.endDate || trip.endDate;
      trip.price = req.body.price || trip.price;
      trip.type = req.body.type || trip.type;
      trip.spots = req.body.spots || trip.spots;
      trip.description = req.body.description !== undefined ? req.body.description : trip.description;

      // Kategorie
      if (req.body.categories) {
        try {
          trip.categories = JSON.parse(req.body.categories);
        } catch (e) {
           // Ignoruj błędy parsowania, zostaw stare lub potraktuj jako string
        }
      }

      // Zdjęcie - aktualizujemy TYLKO jeśli przesłano nowe
      if (req.file) {
        trip.imageUrl = `http://pielgrzymex-api.onrender.com/${req.file.filename}`;
      }

      const updatedTrip = await trip.save();
      res.json(updatedTrip);
    } else {
      res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd edycji: ' + error.message });
  }
});

// 10. USUŃ (Bez zmian)
router.delete('/trips/:id', protect, admin, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) {
      await trip.deleteOne();
      res.json({ message: 'Usunięto' });
    } else {
      res.status(404).json({ message: 'Nie znaleziono' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd usuwania' });
  }
});

module.exports = router;