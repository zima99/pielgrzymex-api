// backend/controllers/userController.js
const User = require('../models/user.model'); 
const bcrypt = require('bcryptjs');

// Upewnij się, że eksportujesz funkcje w ten sposób:
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Nie udało się zaktualizować danych' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    res.json({ message: 'Hasło zmienione' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd zmiany hasła' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: 'Błąd pobierania ulubionych' });
  }
};

exports.getMyTrips = async (req, res) => {
  res.json([]); 
};