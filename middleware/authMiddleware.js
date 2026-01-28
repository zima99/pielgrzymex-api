const jwt = require('jsonwebtoken');
// 👇 Ważne: Importujemy model, aby sprawdzić aktualną rolę w bazie
const User = require('../models/user.model'); 

// 1. Logika weryfikacji tokenu
const protect = async function(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Pobierz token
      token = req.headers.authorization.split(' ')[1];

      // Zweryfikuj token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 👇 KLUCZOWA ZMIANA:
      // Zamiast ufać temu co w tokenie, pobieramy świeżego usera z bazy!
      // Dzięki temu mamy dostęp do pola .role, nawet jak nie było go w tokenie.
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         return res.status(401).json({ message: 'Użytkownik z tego tokenu już nie istnieje.' });
      }

      next();
    } catch (error) {
      console.error("Błąd weryfikacji:", error);
      res.status(401).json({ message: 'Nieautoryzowany, token nieprawidłowy' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Brak tokenu, brak autoryzacji' });
  }
};

// 2. Logika sprawdzania administratora
const admin = function(req, res, next) {
  // Diagnostyka w logach Rendera:
  console.log(`👮 [ADMIN CHECK] User: ${req.user ? req.user.email : 'BRAK'} | Rola: ${req.user ? req.user.role : 'BRAK'}`);

  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    res.status(403).json({ message: 'Błąd 403: Wymagane uprawnienia administratora.' });
  }
};

// 3. Eksport Hybrydowy
module.exports = protect; 
module.exports.protect = protect;
module.exports.admin = admin;