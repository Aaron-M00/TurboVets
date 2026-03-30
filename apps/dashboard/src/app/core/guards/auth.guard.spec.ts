import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

@Component({ standalone: true, template: '' })
class Stub {}

describe('authGuard', () => {
  let auth: AuthService;
  let router: Router;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: Stub }]),
      ],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    injector = TestBed.inject(EnvironmentInjector);
  });

  const run = () =>
    runInInjectionContext(injector, () =>
      authGuard({} as never, { url: '/tasks' } as never),
    );

  it('allows authenticated users through', () => {
    (auth as unknown as { _token: { set: (v: string) => void } })._token.set('valid');
    expect(run()).toBe(true);
  });

  it('redirects unauthenticated users to /login', () => {
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(run()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
