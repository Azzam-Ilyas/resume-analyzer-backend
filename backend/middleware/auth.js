// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'No token provided' });

  // Expecting header format: "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
