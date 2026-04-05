import { config } from '../config.js';

export const verifyAdmin = (req, res, next) => {
  console.log('--- Core Sanctum Auth Check ---');
  console.log('User ID from JWT:', req.user?.id);
  console.log('Authorized IDs:', config.ADMIN_IDS);
  
  if (!req.user || !config.ADMIN_IDS.includes(req.user.id)) {
    console.warn(`Unauthorized access attempt by ${req.user?.id || 'Unknown Identity'}`);
    return res.status(403).json({ 
      error: 'Access Denied: Core Sanctum permission required.',
      details: 'Your identity is not recognized in the ancient admin scrolls.'
    });
  }
  console.log('Access Granted to Core Sanctum.');
  next();
};
