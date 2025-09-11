import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header as fallback
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }
  
  try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = payload.id; // expose userId directly for controllers
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;