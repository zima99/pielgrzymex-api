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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: { type: Date, default: Date.now }
});

// 🔒 POPRAWIONE: Usunęliśmy 'next' z nawiasów i ze środka
userSchema.pre('save', async function() {
  // Jeśli hasło nie było zmieniane, nic nie rób
  if (!this.isModified('password')) return;

  // Hashowanie hasła
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Metoda do sprawdzania hasła przy logowaniu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);