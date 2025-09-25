import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import huggingfaceRouter from "./huggingface";

const app = express();

// Add Helmet with CSP configuration
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'", "https:", "data:", "blob:"],
        "script-src": [
          "'self'", "'unsafe-eval'", "'wasm-unsafe-eval'", "https:", "blob:",
          ...(isProd ? [] : ["'unsafe-inline'"])
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "font-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https:", "wss:", "https://*.supabase.co"],
        "frame-src": ["https:"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

// Increase body size limit for video uploads (200MB to handle larger files)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add Hugging Face API routes
  app.use('/api/huggingface', huggingfaceRouter);
  
  // Add Email API routes - unified email management
  const emailRoutes = await import('./routes/email.js');
  app.use('/api/email', emailRoutes.default);
  
  // Add Podcast API routes
  const podcastRoutes = await import('./routes/podcast.js');
  app.use('/api/podcast', podcastRoutes.default);
  
  // Add Admin API routes - server-side admin operations
  const adminRoutes = await import('./routes/admin.js');
  app.use('/api/admin', adminRoutes.default);
  
  // Add AI API routes - Claude-powered mini-agent
  const aiRoutes = await import('./ai/routes.js');
  app.use('/api/ai', aiRoutes.default);
  
  // Add Paystack webhook routes - secure payment event handling
  const paystackRoutes = await import('./routes/paystack.js');
  app.use('/api/paystack', paystackRoutes.default);
  
  // Add Payment Status API routes - admin payment management tools
  const paymentStatusRoutes = await import('./routes/payment-status.js');
  app.use('/api/payment-status', paymentStatusRoutes.default);
  
  // Add Grace Period API routes - admin grace period management
  const gracePeriodRoutes = await import('./routes/grace-period.js');
  app.use('/api/grace-period', gracePeriodRoutes.default);
  
  // Add Referrals API routes - referral code validation and management
  const referralsRoutes = await import('./routes/referrals.js');
  app.use('/api/referrals', referralsRoutes.default);
  
  // Add Auth API routes - server-side signup with custom email verification
  const authRoutes = await import('./routes/auth.js');
  app.use('/api/auth', authRoutes.default);
  
  // Add Plans API routes - user billing and subscription management
  const plansRoutes = await import('./routes/plans.js');
  app.use('/api/plans', plansRoutes.default);
  
  // Add Payment API routes - user payment history and management
  const paymentRoutes = await import('./routes/payment.js');
  app.use('/api/payment', paymentRoutes.default);
  
  // Add Footer Content API routes - managing website footer legal content
  const footerContentRoutes = await import('./routes/footer-content.js');
  app.use('/api/footer-content', footerContentRoutes.default);
  
  
  const server = await registerRoutes(app);
  
  // Initialize single email system - SimpleEmailScheduler (production ready)
  console.log('📧 Initializing unified email system...');
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  const { simpleEmailScheduler } = await import('./services/SimpleEmailScheduler.js');
  simpleEmailScheduler.start().catch(error => {
    console.error('❌ Failed to start email scheduler:', error);
  });

  // Initialize Grace Period Scheduler for automatic account suspension
  console.log('⏰ Initializing Grace Period Scheduler...');
  const { GracePeriodScheduler } = await import('./services/GracePeriodScheduler.js');
  GracePeriodScheduler.start();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
})();
