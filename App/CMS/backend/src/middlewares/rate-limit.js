"use strict";

const RateLimit = require("koa2-ratelimit").RateLimit;

// Allows 50 requests per IP within a 5-minute window.
// Responds with HTTP 429 when the limit is exceeded.
// The store is in-memory by default — sufficient for a single Railway instance.
// If you ever scale to multiple instances, swap the store for a Redis adapter.
const limiter = RateLimit.middleware({
  interval: { min: 5 },   // 5-minute window
  max: 50,                 // max requests per window per IP
  message: JSON.stringify({
    data: null,
    error: {
      status: 429,
      name: "TooManyRequestsError",
      message: "Too many requests, please try again later.",
    },
  }),
  headers: {
    remaining: "X-RateLimit-Remaining",
    reset:     "X-RateLimit-Reset",
    total:     "X-RateLimit-Limit",
  },
});

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Skip rate limiting for the Strapi admin panel —
    // admins shouldn't be locked out by their own tool.
    if (ctx.path.startsWith("/admin")) {
      return next();
    }
    return limiter(ctx, next);
  };
};
