import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  submitting = signal(false);
  error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/tasks']);
    } catch {
      this.error.set('Invalid email or password');
    } finally {
      this.submitting.set(false);
    }
  }

  fill(email: string): void {
    this.email = email;
    this.password = 'password123';
  }
}
