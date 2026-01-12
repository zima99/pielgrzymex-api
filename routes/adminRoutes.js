const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { protect, admin } = require('../middleware/authMiddleware'); // Importujemy ochroniarzy

// --- 1. POBIERZ WSZYSTKICH UŻYTKOWNIKÓW (GET /api/admin/users) ---
router.get('/users', protect, admin, async (req, res) => {
  try {
    // Pobierz wszystkich, ale bez haseł (dla bezpieczeństwa)
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania użytkowników' });
  }
});

// --- 2. EDYTUJ UŻYTKOWNIKA (PUT /api/admin/users/:id) ---
// Służy do zmiany roli (np. na Premium lub Admina)
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Aktualizujemy dane, jeśli zostały przesłane
      user.role = req.body.role || user.role;
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      
      // Opcjonalnie zmiana hasła (tylko jeśli admin wpisał nowe)
      if (req.body.password) {
          // Model user.model.js sam zahashuje hasło!
          user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd edycji użytkownika' });
  }
});

// --- 3. USUŃ UŻYTKOWNIKA (DELETE /api/admin/users/:id) ---
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'Użytkownik usunięty' });
    } else {
      res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;