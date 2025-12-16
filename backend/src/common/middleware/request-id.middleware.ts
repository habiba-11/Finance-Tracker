import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID from header or generate a new one
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Set request ID in request headers
    req.headers['x-request-id'] = requestId;
    
    // Set request ID in response headers
    res.setHeader('x-request-id', requestId);
    
    next();
  }
}

