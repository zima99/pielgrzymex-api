// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Upewnij się, że ścieżka do middleware jest poprawna. 
// W Twoim kodzie widziałem authMiddleware.js w folderze middleware.
const auth = require('../middleware/authMiddleware'); 

// Profil (Pobieranie i Edycja)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile); // 👈 To jest kluczowe dla zapisu!

// Hasło
router.put('/change-password', auth, userController.changePassword);

// Listy
router.get('/favorites', auth, userController.getFavorites);
router.get('/my-trips', auth, userController.getMyTrips);

module.exports = router;