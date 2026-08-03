import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, ErrorAlertComponent],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <p class="eyebrow">Join talabat</p>
        <h1>Create account</h1>
        <p class="auth-sub">It takes a moment. New accounts start as customers.</p>

        <form (ngSubmit)="submit()">
          <app-error [message]="error()" />
          <div class="field">
            <label for="name">Name</label>
            <input class="input" id="name" [(ngModel)]="name" name="name" required autocomplete="name" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input class="input" id="email" type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input class="input" id="password" type="password" [(ngModel)]="password" name="password" required autocomplete="new-password" />
            <span class="field-hint">At least 8 characters.</span>
          </div>
          <div class="field">
            <label for="confirm">Confirm password</label>
            <input class="input" id="confirm" type="password" [(ngModel)]="confirm" name="confirm" required autocomplete="new-password" />
            @if (confirm && confirm !== password) {
              <span class="field-error">Passwords don't match.</span>
            }
          </div>
          <button class="btn btn-block" type="submit" [disabled]="loading() || !canSubmit()">
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>
        </form>

        <div class="auth-foot">
          Already have an account? <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
})
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirm = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  canSubmit(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.password.length >= 8 &&
      this.password === this.confirm
    );
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.signup(this.name.trim(), this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(apiError(e, 'Sign up failed'));
        this.loading.set(false);
      },
    });
  }
}
