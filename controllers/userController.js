// backend/controllers/userController.js

// 👇 TUTAJ BYŁ BŁĄD: Musi być user.model, bo tak nazywa się plik!
const User = require('../models/user.model'); 
const bcrypt = require('bcryptjs');

// 1. Pobierz dane profilu
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    console.error("Błąd pobierania profilu:", err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};

// 2. Aktualizuj dane profilu
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Walidacja: Czy email nie jest zajęty przez kogoś innego?
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Ten email jest już zajęty.' });
      }
    }

    // Znajdź i zaktualizuj
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error("Błąd aktualizacji:", err);
    res.status(500).json({ message: 'Nie udało się zaktualizować danych' });
  }
};

// 3. Zmień hasło
exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Hasło musi mieć min. 6 znaków' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ message: 'Hasło zostało zmienione' });
  } catch (err) {
    console.error("Błąd zmiany hasła:", err);
    res.status(500).json({ message: 'Błąd zmiany hasła' });
  }
};

// 4. Pobierz Ulubione
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: 'Błąd pobierania ulubionych' });
  }
};

// 5. Pobierz Moje Pielgrzymki
exports.getMyTrips = async (req, res) => {
  try {
    // Tutaj na razie zwracamy pustą tablicę, dopóki nie zrobimy systemu rezerwacji
    res.json([]); 
  } catch (err) {
    res.status(500).json({ message: 'Błąd pobierania wycieczek' });
  }
};