const jwt = require('jsonwebtoken');

// 1. Logika weryfikacji tokenu (To co miałeś wcześniej)
const protect = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu, autoryzacja odmówiona' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Błąd weryfikacji tokenu:", err.message);
    res.status(401).json({ message: 'Token jest nieprawidłowy' });
  }
};

// 2. Logika sprawdzania administratora (NOWOŚĆ - tego brakowało)
const admin = function(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next(); // Jest adminem, przepuść dalej
  } else {
    res.status(403).json({ message: 'Wymagane uprawnienia administratora.' });
  }
};

// 3. Eksport "Hybrydowy" (Klucz do naprawy błędu)
// Dzięki temu działa: const auth = require(...) 
// ORAZ działa: const { protect, admin } = require(...)
module.exports = protect; 
module.exports.protect = protect;
module.exports.admin = admin;