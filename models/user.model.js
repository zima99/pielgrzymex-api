const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  // ROLA: Określa uprawnienia w systemie
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // PREMIUM: Osobna flaga, niezależna od roli
  isPremium: {
    type: Boolean,
    default: false
  },

  // 👇 NOWOŚĆ: Lista ulubionych (referencja do modelu 'Trip')
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip' 
  }],

  createdAt: { type: Date, default: Date.now }
});

// --- Poniżej Twój oryginalny kod (Middleware i Metody) ---

// Szyfrowanie hasła przed zapisem
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Dodano next() dla poprawności
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metoda do sprawdzania hasła przy logowaniu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);