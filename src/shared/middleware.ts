import { Request, Response, NextFunction } from 'express';

// Gateway authentication middleware
export const gatewayAuthMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In production, this would verify the gateway headers
    // For now, just pass through
    next();
  };
};

// Tenant middleware
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get tenant ID from headers (set by API Gateway)
  const tenantId = req.headers['x-tenant-id'] || 'bluedrop';

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  // Make tenant ID available to controllers
  req.headers['x-tenant-id'] = tenantId as string;
  next();
};