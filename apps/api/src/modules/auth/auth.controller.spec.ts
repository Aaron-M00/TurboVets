import { Test } from '@nestjs/testing';
import { RoleName } from '@app/data';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock };

  beforeEach(async () => {
    service = { login: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();
    controller = module.get(AuthController);
  });

  it('forwards login credentials to the service', async () => {
    service.login.mockResolvedValue({ token: 't', user: {} });
    await controller.login({ email: 'a@b', password: 'pw' });
    expect(service.login).toHaveBeenCalledWith('a@b', 'pw');
  });

  it('me returns the current authenticated user untouched', () => {
    const user = {
      id: 'u',
      email: 'a@b',
      role: RoleName.Owner,
      organizationId: 'org',
    };
    expect(controller.me(user)).toBe(user);
  });
});
