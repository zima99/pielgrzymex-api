const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs'); // 👈 WAŻNE: Dodaj ten import do hashowania haseł

// Import middleware (hybrydowy)
const { protect, admin } = require('../middleware/authMiddleware');

// Geolokalizacja (zabezpieczona)
let getGeoData = async () => null;
try {
  const geo = require('../utils/geoHelper');
  getGeoData = geo.getGeoData;
} catch (e) {
  console.log("⚠️ Geolocation disabled (missing geoHelper)");
}

// Konfiguracja Multer (zdjęcia)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
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
    res.status(500).json({ message: 'Błąd pobierania użytkowników: ' + error.message });
  }
});

// 2. POBIERZ JEDNEGO
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'Nie znaleziono użytkownika' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera: ' + error.message });
  }
});

// 3. DODAJ USERA
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, isPremium } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Ten email jest już zajęty!' });

    // Hashowanie hasła ręcznie dla pewności
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName, lastName, email, 
      password: hashedPassword,
      role: role || 'user',
      isPremium: isPremium || false
    });

    if (user) res.status(201).json(user);
    else res.status(400).json({ message: 'Nie udało się utworzyć użytkownika' });
  } catch (error) {
    console.error("Błąd dodawania usera:", error);
    res.status(500).json({ message: error.message });
  }
});

// 4. EDYTUJ USERA (TUTAJ BYŁ BŁĄD 500)
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }

    // 1. Sprawdź czy nowy email nie jest zajęty przez kogoś innego
    if (req.body.email && req.body.email !== user.email) {
       const emailExists = await User.findOne({ email: req.body.email });
       if (emailExists) {
         return res.status(400).json({ message: 'Ten email jest już zajęty przez innego użytkownika!' });
       }
    }

    // 2. Aktualizuj pola podstawowe
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    
    // Zabezpieczenie: konwertuj string "true"/"false" na boolean, jeśli przyjdzie jako string
    if (req.body.role) user.role = req.body.role;
    if (req.body.isPremium !== undefined) user.isPremium = req.body.isPremium;

    // 3. Obsługa hasła (jeśli podano nowe)
    if (req.body.password && req.body.password.length >= 6) {
       const salt = await bcrypt.genSalt(10);
       user.password = await bcrypt.hash(req.body.password, salt);
    }

    // 4. Zapis
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      isPremium: updatedUser.isPremium
    });

  } catch (error) {
    console.error("❌ Błąd edycji usera (Backend):", error);
    // 👇 TERAZ ZOBACZYSZ PRAWDZIWY BŁĄD W PRZEGLĄDARCE!
    res.status(500).json({ message: error.message || 'Błąd edycji danych' });
  }
});

// 5. USUŃ USERA
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'Użytkownik usunięty' });
    } else {
      res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================================
// PIELGRZYMKI
// ==========================================

router.get('/trips', protect, admin, async (req, res) => {
  try {
    const trips = await Trip.find({}).sort({ _id: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/trips/:id', protect, admin, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) res.json(trip);
    else res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/trips', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file 
      ? `https://pielgrzymex-api.onrender.com/uploads/${req.file.filename}` 
      : '';

    let detectedCountry = 'Polska';
    if (req.body.destination && typeof getGeoData === 'function') {
      const geoData = await getGeoData(req.body.destination);
      if (geoData?.country) detectedCountry = geoData.country;
    }
    if (req.body.startLocation && typeof getGeoData === 'function') {
      await getGeoData(req.body.startLocation);
    }

    // Parsowanie kategorii (bo z FormData przychodzą jako string JSON)
    let categories = [];
    if (req.body.categories) {
      try {
        categories = JSON.parse(req.body.categories);
      } catch(e) { categories = []; }
    }

    const tripData = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      price: req.body.price,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startLocation: req.body.startLocation,
      destination: req.body.destination,
      placesCount: req.body.placesCount,
      imageUrl: imageUrl,
      country: detectedCountry,
      categories: categories // Dodajemy kategorie
    };

    const newTrip = new Trip(tripData);
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("Błąd dodawania tripu:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/trips/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });

    if (req.file) {
      req.body.imageUrl = `https://pielgrzymex-api.onrender.com/uploads/${req.file.filename}`;
    }

    // Geolokalizacja
    if (typeof getGeoData === 'function') {
        if (req.body.destination && req.body.destination !== trip.destination) {
           const geoData = await getGeoData(req.body.destination);
           if (geoData?.country) req.body.country = geoData.country;
        } else if (req.body.destination) {
           await getGeoData(req.body.destination);
        }
        if (req.body.startLocation) await getGeoData(req.body.startLocation);
    }

    // Parsowanie kategorii
    if (req.body.categories) {
      try {
        req.body.categories = JSON.parse(req.body.categories);
      } catch(e) { /* ignoruj błąd parsowania */ }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, 
      { ...req.body }, 
      { new: true, runValidators: true }
    );
    
    res.json(updatedTrip);
  } catch (error) {
    console.error("Błąd edycji tripu:", error);
    res.status(500).json({ message: error.message });
  }
});

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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;