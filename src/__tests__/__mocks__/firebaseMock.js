// Jest mock for src/firebase.js — prevents import.meta.env crash
module.exports = {
  auth: null,
  database: null,
  googleProvider: null,
  default: null,
};
