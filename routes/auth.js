const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// --- REJESTRACJA ---
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    console.log('📝 Próba rejestracji:', email);

    // 1. WALIDACJA HASŁA (Nowość)
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

    // 3. Stwórz nowego usera
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // 4. Sukces - zwróć token
    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
        token: generateToken(user._id)
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
        email: user.email,
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