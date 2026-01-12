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
    enum: ['user', 'admin'], // Usunęliśmy 'premium' stąd
    default: 'user'
  },

  // PREMIUM: Osobna flaga, niezależna od roli
  isPremium: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }
});

// ... reszta pliku bez zmian (middleware pre-save i matchPassword) ...

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);