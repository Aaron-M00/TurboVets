import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { RoleName } from '@app/data';
import { AuthService } from './auth.service';

@Component({ standalone: true, template: '' })
class Stub {}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: Stub }]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when nothing is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('persists token + user on successful login', async () => {
    const promise = service.login('a@b', 'pw');
    http.expectOne('/api/auth/login').flush({
      token: 'tok',
      user: { id: '1', email: 'a@b', name: 'A', role: RoleName.Admin, organizationId: 'org' },
    });
    await promise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.role).toBe(RoleName.Admin);
    expect(localStorage.getItem('taskmgr.token')).toBe('tok');
  });

  it('canMutate is true for Owner and Admin, false for Viewer', () => {
    const setRole = (role: RoleName) =>
      (service as unknown as { _user: { set: (v: unknown) => void } })._user.set({
        id: '1',
        email: 'a@b',
        name: 'A',
        role,
        organizationId: 'org',
      });

    setRole(RoleName.Owner);
    expect(service.canMutate()).toBe(true);
    setRole(RoleName.Admin);
    expect(service.canMutate()).toBe(true);
    setRole(RoleName.Viewer);
    expect(service.canMutate()).toBe(false);
  });

  it('logout clears state and redirects to /login', async () => {
    localStorage.setItem('taskmgr.token', 't');
    localStorage.setItem(
      'taskmgr.user',
      JSON.stringify({ id: '1', email: 'a', name: 'A', role: RoleName.Admin, organizationId: 'o' }),
    );
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const fresh = TestBed.inject(AuthService);
    fresh.logout();

    expect(localStorage.getItem('taskmgr.token')).toBeNull();
    expect(spy).toHaveBeenCalledWith(['/login']);
  });
});
