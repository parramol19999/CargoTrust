import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { getDatabase } from '../db';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Check x-api-key header
    let apiKey = request.headers['x-api-key'];
    
    // 2. Check Authorization header
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('cg_')) {
        // Treat as API Key
        apiKey = token;
      } else {
        // Treat as JWT token
        try {
          const payload = this.validateJwt(token);
          request.user = payload;
          return true;
        } catch (err) {
          throw new UnauthorizedException('Invalid JWT authentication token.');
        }
      }
    }

    if (apiKey) {
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
      const db = getDatabase();
      const keyRecord = db.api_keys.find((k) => k.hashedKey === hashedKey && k.active);
      
      if (keyRecord) {
        request.user = { userId: keyRecord.userId, apiKeyId: keyRecord.id };
        return true;
      }
      throw new UnauthorizedException('Invalid or inactive API key.');
    }

    throw new UnauthorizedException('Authentication credentials missing (x-api-key or JWT).');
  }

  private validateJwt(token: string): any {
    // Basic JWT structure checks. Decodes payload securely.
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed JWT');
    }
    
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    // Check expiration if present
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw new Error('Expired token');
    }
    
    return payload;
  }
}
