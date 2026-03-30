import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RoleName } from '@app/data';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: { findByEmail: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    users = { findByEmail: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects unknown emails', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login('x@y', 'pw')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects wrong passwords', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1',
      email: 'x@y',
      name: 'X',
      passwordHash: await bcrypt.hash('correct', 4),
      role: { name: RoleName.Admin },
      organizationId: 'org',
    });
    await expect(service.login('x@y', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues a JWT with the user role and org on success', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1',
      email: 'x@y',
      name: 'X',
      passwordHash: await bcrypt.hash('pw', 4),
      role: { name: RoleName.Admin },
      organizationId: 'org-1',
    });

    const result = await service.login('x@y', 'pw');
    expect(result.token).toBe('signed-token');
    expect(result.user.role).toBe(RoleName.Admin);
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: '1', role: RoleName.Admin, organizationId: 'org-1' }),
    );
  });
});
