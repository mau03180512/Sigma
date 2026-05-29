import rateLimit from 'express-rate-limit';

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req as any).userId || req.ip,
  message: { error: 'Too many requests. Please slow down.' },
});

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => (req as any).userId || req.ip,
  message: { error: 'Too many requests. Please slow down.' },
});
