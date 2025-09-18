import type { Express } from "express";
import { db } from "./db";

export function setupHealthCheck(app: Express) {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Check database connection
      await db.execute('SELECT 1');
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Readiness check (for Kubernetes)
  app.get('/api/ready', async (req, res) => {
    try {
      // Check if application is ready to serve requests
      await db.execute('SELECT 1');
      res.status(200).json({ status: 'ready' });
    } catch (error) {
      res.status(503).json({ status: 'not ready' });
    }
  });

  // Liveness check (for Kubernetes)
  app.get('/api/live', (req, res) => {
    // Simple liveness check - if the process is running, it's alive
    res.status(200).json({ status: 'alive' });
  });
}
