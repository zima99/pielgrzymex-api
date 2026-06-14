const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

if (typeof auth !== 'function') {
    console.error("❌ BŁĄD KRYTYCZNY: 'auth' nie jest funkcją! Sprawdź plik middleware/authMiddleware.js");
}

// --- TRASY ---
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/change-password', auth, userController.changePassword);
router.get('/favorites', auth, userController.getFavorites);
router.get('/my-trips', auth, userController.getMyTrips);

// 👇 NOWA TRASA: Przełączanie ulubionych po ID wycieczki
router.post('/favorites/:tripId', auth, userController.toggleFavorite);

module.exports = router;