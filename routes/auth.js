const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs'); // Dodaj to, jeśli brakowało

// --- REJESTRACJA ---
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // 1. Sprawdź czy user już istnieje
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Użytkownik o tym emailu już istnieje' });
    }

    // 2. Stwórz nowego usera
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // 3. Odpowiedz sukcesem
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
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
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Błędny email lub hasło' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Funkcja pomocnicza do generowania tokena
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = router;