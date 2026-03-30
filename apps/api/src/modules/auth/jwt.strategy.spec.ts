import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RoleName } from '@app/data';
import type { JwtPayload } from '@app/auth';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let users: { findById: jest.Mock };

  beforeEach(async () => {
    users = { findById: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret' } },
      ],
    }).compile();
    strategy = module.get(JwtStrategy);
  });

  const payload: JwtPayload = {
    sub: 'user-1',
    email: 'a@b',
    role: RoleName.Admin,
    organizationId: 'org-1',
  };

  it('returns the slimmed AuthUser when the user exists', async () => {
    users.findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@b',
      organizationId: 'org-1',
      role: { name: RoleName.Admin },
    });
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      id: 'user-1',
      email: 'a@b',
      role: RoleName.Admin,
      organizationId: 'org-1',
    });
  });

  it('rejects revoked or deleted users even with a valid token', async () => {
    users.findById.mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
