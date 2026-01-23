const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
// 👇 ZMIANA: Importujemy nową funkcję getGeoData zamiast saveLocationToDb
const { getGeoData } = require('../utils/geoHelper');

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

// 2. POBIERZ JEDNEGO USERA
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

// ==========================================
// PIELGRZYMKI
// ==========================================

// 6. POBIERZ WSZYSTKIE
router.get('/trips', protect, admin, async (req, res) => {
  try {
    const trips = await Trip.find({}).sort({ _id: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania' });
  }
});

// 7. POBIERZ JEDNĄ
router.get('/trips/:id', protect, admin, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) res.json(trip);
    else res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// 8. DODAJ PIELGRZYMKĘ (Z UPLOADEM I GEO-LOKALIZACJĄ)
router.post('/trips', upload.single('image'), async (req, res) => {
  try {
    // 1. Link do zdjęcia
    const imageUrl = req.file 
      ? `https://pielgrzymex-api.onrender.com/uploads/${req.file.filename}` 
      : '';

    // 2. AUTOMATYCZNE WYKRYWANIE KRAJU I ZAPIS LOKALIZACJI
    let detectedCountry = 'Polska'; // Domyślnie
    
    // Jeśli podano cel, sprawdź kraj i zapisz coords
    if (req.body.destination) {
      const geoData = await getGeoData(req.body.destination);
      if (geoData && geoData.country) {
        detectedCountry = geoData.country;
        console.log(`📍 Wykryto kraj: ${detectedCountry} (dla ${req.body.destination})`);
      }
    }

    // Jeśli podano start, zapisz tylko coords (dla mapy)
    if (req.body.startLocation) {
      await getGeoData(req.body.startLocation);
    }

    // 3. Obiekt tripData
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
      country: detectedCountry // 👈 ZAPISUJEMY KRAJ
    };

    // 4. Zapis w bazie
    const newTrip = new Trip(tripData);
    await newTrip.save();

    res.status(201).json(newTrip);
  } catch (error) {
    console.error("Błąd dodawania pielgrzymki:", error);
    res.status(500).json({ message: error.message });
  }
});

// 9. EDYTUJ PIELGRZYMKĘ (Z UPLOADEM I AKTUALIZACJĄ KRAJU)
router.put('/trips/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    // Znajdź istniejącą
    const trip = await Trip.findById(req.params.id);
    
    if (trip) {
      // Jeśli przesłano plik, aktualizujemy link
      if (req.file) {
        req.body.imageUrl = `https://pielgrzymex-api.onrender.com/uploads/${req.file.filename}`;
      }

      // --- AKTUALIZACJA GEOLOKALIZACJI ---
      // Jeśli zmieniono destination -> sprawdź nowy kraj
      if (req.body.destination && req.body.destination !== trip.destination) {
         const geoData = await getGeoData(req.body.destination);
         if (geoData && geoData.country) {
            req.body.country = geoData.country; // Nadpisujemy kraj w obiekcie do zapisu
         }
      } else if (req.body.destination) {
         // Nawet jak nazwa się nie zmieniła, warto odświeżyć coords w tabeli locations
         await getGeoData(req.body.destination);
      }

      if (req.body.startLocation) {
         await getGeoData(req.body.startLocation);
      }
      // ------------------------------------

      // Aktualizuj wszystko co przyszło w req.body
      const updatedTrip = await Trip.findByIdAndUpdate(
        req.params.id, 
        { ...req.body }, 
        { new: true }
      );
      
      res.json(updatedTrip);
    } else {
      res.status(404).json({ message: 'Nie znaleziono pielgrzymki' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd edycji: ' + error.message });
  }
});

// 10. USUŃ
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