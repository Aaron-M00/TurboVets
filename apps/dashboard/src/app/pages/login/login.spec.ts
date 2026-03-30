import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RoleName } from '@app/data';
import { LoginPage } from './login';

@Component({ standalone: true, template: '' })
class Stub {}

describe('LoginPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: Stub },
          { path: 'tasks', component: Stub },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('redirects to /tasks after a successful login', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.email = 'a@b';
    fixture.componentInstance.password = 'pw';
    const submission = fixture.componentInstance.submit();

    http.expectOne('/api/auth/login').flush({
      token: 't',
      user: { id: '1', email: 'a@b', name: 'A', role: RoleName.Admin, organizationId: 'org' },
    });
    await submission;

    expect(navigate).toHaveBeenCalledWith(['/tasks']);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('surfaces an error message on bad credentials', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email = 'a@b';
    fixture.componentInstance.password = 'wrong';

    const submission = fixture.componentInstance.submit();
    http.expectOne('/api/auth/login').flush(
      { message: 'Invalid' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await submission;

    expect(fixture.componentInstance.error()).toBe('Invalid email or password');
  });

  it('fill() pre-populates email and the demo password', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.fill('owner@acme.test');
    expect(fixture.componentInstance.email).toBe('owner@acme.test');
    expect(fixture.componentInstance.password).toBe('password123');
  });
});
