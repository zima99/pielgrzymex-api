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

// 3. DODAJ USERA (NAPRAWIONE: Omija błąd "next is not a function")
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, isPremium } = req.body;
    
    // 1. Sprawdź czy email zajęty
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Ten email jest już zajęty!' });

    // 2. Hashowanie hasła (Obowiązkowe, bo omijamy model)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Przygotowanie obiektu (Ręcznie, bo omijamy Mongoose)
    const newUserObj = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'user',
      isPremium: isPremium || false,
      isAdmin: role === 'admin', // Dla pewności
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0 // Wersjonowanie dokumentu
    };

    // 4. BEZPOŚREDNI ZAPIS DO KOLEKCJI
    // Używamy .collection.insertOne zamiast .create()
    // To omija uszkodzony hook pre('save') w modelu User
    const result = await User.collection.insertOne(newUserObj);

    // 5. Zwracamy utworzonego usera
    // result.ops to tablica wstawionych dokumentów (w starszych sterownikach)
    // w nowszych result.insertedId to ID.
    if (result.acknowledged) {
       res.status(201).json({ ...newUserObj, _id: result.insertedId });
    } else {
       throw new Error('Nie udało się wstawić użytkownika do bazy.');
    }

  } catch (error) {
    console.error("Błąd dodawania usera (Backend):", error);
    res.status(500).json({ message: error.message || 'Błąd serwera' });
  }
});

// 4. EDYTUJ USERA (POPRAWKA: Używamy findByIdAndUpdate zamiast save())
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, role, isPremium, password } = req.body;

    // 1. Sprawdź czy użytkownik istnieje
    const userToCheck = await User.findById(req.params.id);
    if (!userToCheck) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }

    // 2. Sprawdź duplikat emaila (tylko jeśli user zmienia email)
    if (email && email !== userToCheck.email) {
       const emailExists = await User.findOne({ email });
       if (emailExists) {
         return res.status(400).json({ message: 'Ten email jest już zajęty!' });
       }
    }

    // 3. Budujemy obiekt tylko z tymi polami, które chcemy zmienić
    const updateData = {
      firstName: firstName || userToCheck.firstName,
      lastName: lastName || userToCheck.lastName,
      email: email || userToCheck.email,
      role: role || userToCheck.role,
      isPremium: isPremium !== undefined ? isPremium : userToCheck.isPremium
    };

    // 4. Obsługa hasła (Hashujemy ręcznie, omijając hooki modelu)
    if (password && password.length >= 6) {
       const salt = await bcrypt.genSalt(10);
       updateData.password = await bcrypt.hash(password, salt);
    }

    // 5. ATOMOWY ZAPIS (To naprawia błąd "next is not a function")
    // findByIdAndUpdate nie uruchamia pre('save'), więc błąd znika.
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true } // new: true zwraca zaktualizowany obiekt
    ).select('-password');
    
    res.json(updatedUser);

  } catch (error) {
    console.error("❌ Błąd edycji usera:", error);
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