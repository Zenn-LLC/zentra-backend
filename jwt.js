const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY;

function generateToken(payload) {
  const expiresIn = '1h';

  const token = jwt.sign(payload, secretKey, { expiresIn: expiresIn });

  return token;
}

// Function to verify a JWT
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    // Token verification failed
    return null;
  }
}

module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken
}
