const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Pobierz token z nagłówka
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // 2. Sprawdź czy token istnieje
  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu, autoryzacja odmówiona' });
  }

  try {
    // 3. Zweryfikuj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Dodaj użytkownika do requestu (req.user)
    req.user = decoded;
    
    // 5. Przejdź dalej
    next();
  } catch (err) {
    console.error("Błąd weryfikacji tokenu:", err.message);
    res.status(401).json({ message: 'Token jest nieprawidłowy' });
  }
};