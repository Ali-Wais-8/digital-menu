"use strict";

module.exports = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "*.r2.dev",
            "*.cloudflarestorage.com",
          ],
          "media-src": ["'self'", "data:", "blob:", "*.r2.dev"],
          upgradeInsecureRequests: null,
        },
      },
      poweredBy: false,
    },
  },
  {
    name: "strapi::cors",
    config: {
      headers: ["Content-Type", "Authorization", "Origin", "Accept"],
      origin: [
        "https://digital-menu-swart.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
    },
  },
  // Rate limit: max 50 requests per IP within a 5-minute window.
  // Uses koa2-ratelimit which is already compatible with Strapi's Koa core.
  // Install with: npm install koa2-ratelimit
  {
    name: "global::rate-limit",
    config: {},
  },
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];