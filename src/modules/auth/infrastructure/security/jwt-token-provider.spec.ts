import { createHash } from 'node:crypto';

import { JwtService } from '@nestjs/jwt';

import { JwtTokenProvider } from './jwt-token-provider';
import { EnvConfig } from '../../../../shared/config/env.config';

describe('JwtTokenProvider', () => {
  let jwtService: jest.Mocked<JwtService>;
  let envConfig: EnvConfig;
  let provider: JwtTokenProvider;

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
      decode: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    envConfig = {
      jwtAccessSecret: 'access-secret',
      jwtAccessExpiresIn: '15m',
      jwtRefreshSecret: 'refresh-secret',
      jwtRefreshExpiresIn: '7d',
    } as unknown as EnvConfig;
    provider = new JwtTokenProvider(jwtService, envConfig);
  });

  describe('generateAccessToken', () => {
    it('signs with the access secret/expiry and decodes the expiry claim', async () => {
      jwtService.signAsync.mockResolvedValue('signed-access-token');
      const exp = Math.floor(Date.now() / 1000) + 900;
      jwtService.decode.mockReturnValue({ exp });

      const result = await provider.generateAccessToken({
        subject: 'user-1',
        role: 'CLIENT',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          role: 'CLIENT',
          jti: expect.any(String) as string,
        },
        { secret: 'access-secret', expiresIn: '15m' },
      );
      expect(result.token).toBe('signed-access-token');
      expect(result.expiresAt).toEqual(new Date(exp * 1000));
    });
  });

  describe('generateRefreshToken', () => {
    it('signs with the refresh secret/expiry', async () => {
      jwtService.signAsync.mockResolvedValue('signed-refresh-token');
      const exp = Math.floor(Date.now() / 1000) + 604_800;
      jwtService.decode.mockReturnValue({ exp });

      const result = await provider.generateRefreshToken({
        subject: 'user-1',
        role: 'ADMIN',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          role: 'ADMIN',
          jti: expect.any(String) as string,
        },
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
      expect(result.token).toBe('signed-refresh-token');
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload for a valid token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        role: 'CLIENT',
      });

      const result = await provider.verifyAccessToken('valid-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'access-secret',
      });
      expect(result).toEqual({ subject: 'user-1', role: 'CLIENT' });
    });

    it('returns null instead of throwing for an invalid/expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const result = await provider.verifyAccessToken('bad-token');

      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('verifies against the refresh secret', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        role: 'CLIENT',
      });

      await provider.verifyRefreshToken('refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'refresh-secret',
      });
    });

    it('returns null for an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

      const result = await provider.verifyRefreshToken('tampered-token');

      expect(result).toBeNull();
    });
  });

  describe('hashToken', () => {
    it('returns a deterministic sha256 hex digest', async () => {
      const result = await provider.hashToken('some-refresh-token');

      expect(result).toBe(
        createHash('sha256').update('some-refresh-token').digest('hex'),
      );
    });

    it('produces the same hash for the same input', async () => {
      const first = await provider.hashToken('same-token');
      const second = await provider.hashToken('same-token');

      expect(first).toBe(second);
    });
  });
});
