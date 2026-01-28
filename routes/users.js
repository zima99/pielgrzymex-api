const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // Twój middleware sprawdzający token JWT

// Profil
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Hasło
router.put('/change-password', auth, userController.changePassword);

// Listy
router.get('/favorites', auth, userController.getFavorites);
router.get('/my-trips', auth, userController.getMyTrips);

module.exports = router;