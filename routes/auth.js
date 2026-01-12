const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Importujemy model użytkownika (upewnij się, że plik istnieje w folderze models!)
const User = require('../models/user.model');

// --- REJESTRACJA (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    console.log('📝 Próba rejestracji dla:', email);

    // 1. Sprawdź czy user już istnieje
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Użytkownik o tym emailu już istnieje' });
    }

    // 2. Stwórz nowego usera 
    // (Hasło zahashuje się samo dzięki kodzie w user.model.js)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // 3. Wygeneruj token i odeślij odpowiedź
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

// --- LOGOWANIE (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Znajdź usera po emailu
    const user = await User.findOne({ email });

    // 2. Sprawdź hasło (metoda matchPassword jest zdefiniowana w modelu)
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
    console.error('❌ Błąd logowania:', error);
    res.status(500).json({ message: 'Błąd serwera: ' + error.message });
  }
});

// Funkcja pomocnicza do generowania tokena
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = router;