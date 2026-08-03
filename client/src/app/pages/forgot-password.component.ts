import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ErrorAlertComponent } from './shared/ui.components';
import { ToastService } from './shared/toast.service';
import { apiError } from './shared/errors';

// Three-step reset: request code → verify code → set new password.
// The backend returns the code in the response in non-production, so we
// surface it as a hint to make the flow testable without email.
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, ErrorAlertComponent],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <p class="eyebrow">Account recovery</p>
        <h1>Reset password</h1>

        <!-- progress -->
        <div class="stepper mb-2" style="margin-top:.5rem">
          <span class="stepper-step" [class.done]="step() >= 1"><span class="num">1</span> Email</span>
          <span class="stepper-line"></span>
          <span class="stepper-step" [class.done]="step() >= 2"><span class="num">2</span> Code</span>
          <span class="stepper-line"></span>
          <span class="stepper-step" [class.done]="step() >= 3"><span class="num">3</span> New password</span>
        </div>

        <app-error [message]="error()" />

        @if (devCode()) {
          <div class="alert alert-info">
            Dev mode — your reset code is <strong>&nbsp;{{ devCode() }}</strong>
          </div>
        }

        @if (step() === 1) {
          <form (ngSubmit)="requestCode()">
            <p class="auth-sub">Enter your email and we'll send a 6-digit code.</p>
            <div class="field">
              <label for="email">Email</label>
              <input class="input" id="email" type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
            </div>
            <button class="btn btn-block" type="submit" [disabled]="loading()">
              {{ loading() ? 'Sending…' : 'Send code' }}
            </button>
          </form>
        } @else if (step() === 2) {
          <form (ngSubmit)="verify()">
            <p class="auth-sub">Enter the code sent to {{ email }}.</p>
            <div class="field">
              <label for="code">Reset code</label>
              <input class="input" id="code" [(ngModel)]="code" name="code" required inputmode="numeric" placeholder="123456" />
            </div>
            <button class="btn btn-block" type="submit" [disabled]="loading()">
              {{ loading() ? 'Verifying…' : 'Verify code' }}
            </button>
          </form>
        } @else {
          <form (ngSubmit)="reset()">
            <p class="auth-sub">Choose a new password for {{ email }}.</p>
            <div class="field">
              <label for="newpw">New password</label>
              <input class="input" id="newpw" type="password" [(ngModel)]="newPassword" name="newPassword" required autocomplete="new-password" />
              <span class="field-hint">At least 8 characters.</span>
            </div>
            <button class="btn btn-block" type="submit" [disabled]="loading() || newPassword.length < 8">
              {{ loading() ? 'Saving…' : 'Set new password' }}
            </button>
          </form>
        }

        <div class="auth-foot">
          Remembered it? <a routerLink="/login">Back to sign in</a>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  step = signal(1);
  email = '';
  code = '';
  newPassword = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly devCode = signal<string | null>(null);

  requestCode(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        if (res.resetCode) this.devCode.set(res.resetCode);
        this.step.set(2);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Could not send a reset code'));
        this.loading.set(false);
      },
    });
  }

  verify(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.verifyResetCode(this.code.trim()).subscribe({
      next: () => {
        this.step.set(3);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Invalid or expired code'));
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.resetPassword(this.email.trim(), this.newPassword).subscribe({
      next: (res) => {
        // Backend issues a fresh token (but no user body); store it, then
        // load the profile so the app knows who is signed in.
        if (res.token) this.auth.setToken(res.token);
        this.api.getMe().subscribe({
          next: (me) => {
            this.auth.setUser(me.data.user);
            this.toast.success('Password updated. You are signed in.');
            this.router.navigate(['/']);
          },
          error: () => {
            // Token stored but profile fetch failed — send them to login.
            this.toast.success('Password updated. Please sign in.');
            this.router.navigate(['/login']);
          },
        });
      },
      error: (e) => {
        this.error.set(apiError(e, 'Could not reset the password'));
        this.loading.set(false);
      },
    });
  }
}
