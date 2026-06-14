const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <--- DODANE: Do ręcznego szyfrowania hasła
const User = require('../models/user.model');

// --- REJESTRACJA ---
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    console.log('📝 Próba rejestracji:', email);

    // 1. WALIDACJA HASŁA
    // Min. 6 znaków, jedna duża litera, jedna cyfra, jeden znak specjalny
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Hasło jest za słabe. Wymagane: min. 6 znaków, duża litera, cyfra i znak specjalny.' 
      });
    }

    // 2. Sprawdź czy user już istnieje
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Użytkownik o tym emailu już istnieje' });
    }

    // 3. Ręczne szyfrowanie hasła (omijamy zepsuty model Mongoose)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Przygotowanie obiektu
    const newUserObj = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'user',
      isPremium: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    // 5. Stwórz nowego usera BEZPOŚREDNIO w kolekcji
    const result = await User.collection.insertOne(newUserObj);

    // 6. Sukces - zwróć token
    if (result.acknowledged) {
      res.status(201).json({
        _id: result.insertedId,
        firstName: newUserObj.firstName,
        email: newUserObj.email,
        token: generateToken(result.insertedId)
      });
    } else {
      res.status(400).json({ message: 'Nie udało się utworzyć użytkownika' });
    }

  } catch (error) {
    console.error('❌ Błąd rejestracji:', error);
    res.status(500).json({ message: 'Błąd serwera: ' + error.message });
  }
});

// --- LOGOWANIE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName, // Warto też zwracać nazwisko
        email: user.email,
        role: user.role, // <--- WAŻNE: Tego brakowało! Teraz Frontend będzie widział rolę.
        isPremium: user.isPremium,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Błędny email lub hasło' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera: ' + error.message });
  }
});

// Funkcja pomocnicza do tokena
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = router;