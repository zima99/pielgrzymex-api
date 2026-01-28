const User = require('../models/user.model');
const Trip = require('../models/Trip');
// const Booking = require('../models/Booking'); // Odkomentuj, jeśli masz model Rezerwacji
const bcrypt = require('bcryptjs');

// 1. Pobierz dane profilu
exports.getProfile = async (req, res) => {
  try {
    // req.user.id pochodzi z middleware'a autoryzacji (JWT)
    const user = await User.findById(req.user.id).select('-password'); // Nie odsyłamy hasła!
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
};

// 2. Aktualizuj dane profilu
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Znajdź i zaktualizuj
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true } // Zwróć zaktualizowany obiekt
    ).select('-password');

    res.json(user);
  } catch (err) {
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

// 5. Pobierz Moje Pielgrzymki (Kupione)
exports.getMyTrips = async (req, res) => {
  try {
    // UWAGA: To zadziała tylko, jeśli masz system rezerwacji (model Booking).
    // Jeśli nie, na razie zwracamy pustą tablicę lub musisz stworzyć model Booking.
    
    // PRZYKŁAD Z MODELINGIEM BOOKING:
    // const bookings = await Booking.find({ user: req.user.id }).populate('trip');
    // const trips = bookings.map(b => b.trip);
    // res.json(trips);

    // TYMCZASOWO (żeby frontend nie krzyczał błędem):
    res.json([]); 
  } catch (err) {
    res.status(500).json({ message: 'Błąd pobierania wycieczek' });
  }
};