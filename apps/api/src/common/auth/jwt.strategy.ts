import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;          // userId or apiKeyId
  actorType: 'USER' | 'PARTNER' | 'ADMIN' | 'SYSTEM';
  scopes: string[];     // e.g. ['business:claim', 'business:write']
  tenantId?: string;    // partner tenant isolation
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.actorType) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
