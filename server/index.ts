import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Temporarily commented out due to vite dependency issue
// import { setupVite, serveStatic, log } from "./vite";
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
import huggingfaceRouter from "./huggingface";

const app = express();
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
  
  // Add Email API routes
  const emailRoutes = await import('./routes/email.js');
  app.use('/api/email', emailRoutes.default);
  
  // Add Email Queue API routes
  const emailQueueRoutes = await import('./routes/email-queue.js');
  app.use('/api/email-queue', emailQueueRoutes.default);
  
  // Add Simple Email API routes
  const simpleEmailRoutes = await import('./routes/simple-email.js');
  app.use('/api/simple-email', simpleEmailRoutes.default);
  
  const server = await registerRoutes(app);
  
  // Initialize Simple Email Scheduler
  const { simpleEmailScheduler } = await import('./services/SimpleEmailScheduler.js');
  simpleEmailScheduler.start().catch(error => {
    console.error('❌ Failed to start email scheduler:', error);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Temporary frontend serving solution while fixing vite dependency
  const path = await import('path');
  
  // Serve static files from client directory in development
  app.use(express.static(path.resolve(import.meta.dirname, '..', 'client')));
  
  // Serve a simple loading page for all non-API routes until we fix the build system
  app.get('*', async (req, res) => {
    try {
      const simpleIndexPath = path.resolve(import.meta.dirname, '..', 'client', 'simple-index.html');
      res.sendFile(simpleIndexPath);
    } catch (error) {
      res.status(500).send('<h1>Frontend loading error. Please check console for details.</h1>');
    }
  });

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
