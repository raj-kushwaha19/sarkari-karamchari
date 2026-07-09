const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  // Support both cookie (same-domain) and Authorization header (cross-domain)
  let token = req.cookies && req.cookies.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

module.exports = verifyJWT;
