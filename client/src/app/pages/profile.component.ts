import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { User } from '../core/models';
import { SpinnerComponent, ErrorAlertComponent } from './shared/ui.components';
import { ToastService } from './shared/toast.service';
import { ConfirmDialogService } from './shared/confirm-dialog.service';
import { apiError } from './shared/errors';

// Self-service account: edit profile (name/email/phone/photo),
// change password, and account actions (sign out, delete account).
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, ErrorAlertComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="eyebrow">Your account</p>
        <h1>Profile</h1>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else {
        <div class="stack" style="max-width:620px">
          <!-- profile details -->
          <div class="card card-pad">
            <h3 class="mb-2">Profile details</h3>
            <app-error [message]="profileError()" />
            <form (ngSubmit)="saveProfile()">
              <div class="row mb-2" style="gap:1rem">
                @if (photoPreview()) {
                  <img class="avatar" style="width:64px;height:64px" [src]="photoPreview()!" alt="Profile photo" />
                } @else {
                  <div class="avatar" style="width:64px;height:64px;display:grid;place-items:center;font-size:1.4rem;color:var(--ink-faint)">
                    {{ (name || 'U').charAt(0).toUpperCase() }}
                  </div>
                }
                <label class="file-drop" style="flex:1">
                  {{ photoFile ? photoFile.name : 'Change profile photo (click to choose)' }}
                  <input type="file" accept="image/*" hidden (change)="onPhoto($event)" />
                </label>
              </div>
              <div class="form-grid">
                <div class="field">
                  <label for="name">Name</label>
                  <input class="input" id="name" [(ngModel)]="name" name="name" required />
                </div>
                <div class="field">
                  <label for="phone">Phone</label>
                  <input class="input" id="phone" [(ngModel)]="phone" name="phone" />
                </div>
                <div class="field full">
                  <label for="email">Email</label>
                  <input class="input" id="email" type="email" [(ngModel)]="email" name="email" required />
                </div>
              </div>
              <button class="btn" type="submit" [disabled]="savingProfile()">
                {{ savingProfile() ? 'Saving…' : 'Save changes' }}
              </button>
            </form>
          </div>

          <!-- change password -->
          <div class="card card-pad">
            <h3 class="mb-2">Change password</h3>
            <app-error [message]="pwError()" />
            <form (ngSubmit)="changePassword()">
              <div class="field">
                <label for="cur">Current password</label>
                <input class="input" id="cur" type="password" [(ngModel)]="currentPassword" name="cur" required autocomplete="current-password" />
              </div>
              <div class="field">
                <label for="new">New password</label>
                <input class="input" id="new" type="password" [(ngModel)]="newPassword" name="new" required autocomplete="new-password" />
                <span class="field-hint">At least 8 characters.</span>
              </div>
              <button class="btn" type="submit" [disabled]="savingPw() || newPassword.length < 8">
                {{ savingPw() ? 'Updating…' : 'Update password' }}
              </button>
            </form>
          </div>

          <!-- account actions -->
          <div class="card card-pad danger-zone">
            <h3 class="mb-2">Account</h3>
            <div class="row row-wrap">
              <button class="btn btn-ghost" (click)="signOut()">Sign out</button>
              <button class="btn btn-danger" (click)="deleteAccount()">Delete account</button>
            </div>
            <p class="field-hint mt-1">Deleting deactivates your account. This can't be undone from here.</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly savingProfile = signal(false);
  readonly savingPw = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly pwError = signal<string | null>(null);
  readonly photoPreview = signal<string | null>(null);

  name = '';
  email = '';
  phone = '';
  photoFile: File | null = null;
  currentPassword = '';
  newPassword = '';

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: (r) => {
        this.fill(r.data.user);
        this.loading.set(false);
      },
      error: () => {
        // Fall back to cached user if the call fails.
        const u = this.auth.user();
        if (u) this.fill(u);
        this.loading.set(false);
      },
    });
  }

  private fill(u: User): void {
    this.name = u.name;
    this.email = u.email;
    this.phone = u.phone ?? '';
    this.photoPreview.set(u.profileImage ?? null);
  }

  onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile = file;
    this.photoPreview.set(URL.createObjectURL(file));
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    this.profileError.set(null);
    const fd = new FormData();
    fd.append('name', this.name.trim());
    fd.append('email', this.email.trim());
    fd.append('phone', this.phone.trim());
    if (this.photoFile) fd.append('profileImage', this.photoFile);
    this.api.updateMe(fd).subscribe({
      next: (r) => {
        this.auth.setUser(r.data);
        this.photoPreview.set(r.data.profileImage ?? this.photoPreview());
        this.photoFile = null;
        this.toast.success('Profile updated');
        this.savingProfile.set(false);
      },
      error: (e) => {
        this.profileError.set(apiError(e, 'Could not update profile'));
        this.savingProfile.set(false);
      },
    });
  }

  changePassword(): void {
    this.savingPw.set(true);
    this.pwError.set(null);
    this.api.updateMyPassword(this.currentPassword, this.newPassword).subscribe({
      next: (res) => {
        if (res.token) this.auth.setToken(res.token);
        this.currentPassword = '';
        this.newPassword = '';
        this.toast.success('Password changed');
        this.savingPw.set(false);
      },
      error: (e) => {
        this.pwError.set(apiError(e, 'Could not change password'));
        this.savingPw.set(false);
      },
    });
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  async deleteAccount(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Delete account?',
      message: 'Your account will be deactivated and you will be signed out.',
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteMe().subscribe({
      next: () => {
        this.auth.logout();
        this.toast.success('Account deleted');
        this.router.navigate(['/']);
      },
      error: (e) => this.toast.error(apiError(e, 'Could not delete account')),
    });
  }
}
