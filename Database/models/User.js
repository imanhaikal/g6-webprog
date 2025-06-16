const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  weight: { type: Number },
  height: { type: Number },
  password: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Users', userSchema);