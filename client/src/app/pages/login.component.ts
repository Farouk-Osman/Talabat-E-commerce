import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, ErrorAlertComponent],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <p class="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p class="auth-sub">Access your account and, if you're an admin, the dashboard.</p>

        <form (ngSubmit)="submit()">
          <app-error [message]="error()" />
          <div class="field">
            <label for="email">Email</label>
            <input class="input" id="email" type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input class="input" id="password" type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </div>
          <div class="text-center mb-2">
            <a routerLink="/forgot-password" style="font-size:.85rem">Forgot your password?</a>
          </div>
          <button class="btn btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <div class="auth-foot">
          New here? <a routerLink="/signup">Create an account</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(apiError(e, 'Login failed'));
        this.loading.set(false);
      },
    });
  }
}
