const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 👇 Importujemy middleware (teraz na pewno jest funkcją)
const auth = require('../middleware/authMiddleware');

// --- DIAGNOSTYKA (Dla pewności przy deployu) ---
if (typeof auth !== 'function') {
    console.error("❌ BŁĄD KRYTYCZNY: 'auth' nie jest funkcją! Sprawdź plik middleware/authMiddleware.js");
}
if (!userController.getProfile) {
    console.error("❌ BŁĄD KRYTYCZNY: 'userController' nie ma metody getProfile!");
}

// --- TRASY ---

// Profil
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Zmiana hasła
router.put('/change-password', auth, userController.changePassword);

// Listy (Ulubione / Wycieczki)
router.get('/favorites', auth, userController.getFavorites);
router.get('/my-trips', auth, userController.getMyTrips);

module.exports = router;