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

router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});
// --- 2. EDYTUJ UŻYTKOWNIKA (PUT /api/admin/users/:id) ---
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Aktualizujemy podstawowe dane
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      
      // Rola (user/admin)
      if (req.body.role) {
        user.role = req.body.role;
      }

      // Premium (Boolean) - sprawdzamy czy zostało przesłane
      if (req.body.isPremium !== undefined) {
        user.isPremium = req.body.isPremium;
      }
      
      // Zmiana hasła
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        role: updatedUser.role,
        isPremium: updatedUser.isPremium // Zwracamy info o premium
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