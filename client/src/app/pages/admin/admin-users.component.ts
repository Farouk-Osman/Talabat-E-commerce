import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from '../shared/ui.components';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { apiError } from '../shared/errors';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="row mb-2">
      <h2>Users</h2>
      <div class="spacer"></div>
      <button class="btn" (click)="openCreate()">+ New user</button>
    </div>

    <app-error [message]="error()" />
    @if (loading()) {
      <app-spinner />
    } @else if (items().length === 0) {
      <app-empty title="No users" message="Users who sign up will appear here." />
    } @else {
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th></th><th>Name</th><th>Email</th><th>Role</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            @for (u of items(); track u._id) {
              <tr>
                <td>
                  @if (u.profileImage) { <img class="thumb" [src]="u.profileImage" [alt]="u.name" /> }
                  @else { <div class="thumb" style="display:grid;place-items:center;color:var(--ink-faint)">{{ u.name.charAt(0) }}</div> }
                </td>
                <td><strong>{{ u.name }}</strong></td>
                <td class="muted">{{ u.email }}</td>
                <td>
                  <span class="badge" [class.badge-accent]="u.role === 'admin'">{{ u.role }}</span>
                </td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(u)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="remove(u)" [disabled]="u._id === myId()">Delete</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (showModal()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3>{{ editing() ? 'Edit user' : 'New user' }}</h3>
            <button class="icon-btn" (click)="close()" aria-label="Close">×</button>
          </div>
          <form (ngSubmit)="save()">
            <div class="modal-body">
              <app-error [message]="formError()" />
              <div class="form-grid">
                <div class="field">
                  <label for="name">Name</label>
                  <input class="input" id="name" [(ngModel)]="form.name" name="name" required />
                </div>
                <div class="field">
                  <label for="role">Role</label>
                  <select class="select" id="role" [(ngModel)]="form.role" name="role">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div class="field full">
                  <label for="email">Email</label>
                  <input class="input" id="email" type="email" [(ngModel)]="form.email" name="email" required />
                </div>
                @if (!editing()) {
                  <div class="field full">
                    <label for="password">Password</label>
                    <input class="input" id="password" type="password" [(ngModel)]="form.password" name="password" required autocomplete="new-password" />
                    <span class="field-hint">At least 8 characters.</span>
                  </div>
                }
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
              <button type="submit" class="btn" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly items = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editing = signal<User | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  form: { name: string; email: string; password: string; role: 'user' | 'admin' } = {
    name: '',
    email: '',
    password: '',
    role: 'user',
  };

  myId(): string | undefined {
    return this.auth.user()?._id;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (r) => {
        this.items.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load users'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '', email: '', password: '', role: 'user' };
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(u: User): void {
    this.editing.set(u);
    this.form = { name: u.name, email: u.email, password: '', role: u.role };
    this.formError.set(null);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    this.saving.set(true);
    this.formError.set(null);
    const fd = new FormData();
    fd.append('name', this.form.name.trim());
    fd.append('email', this.form.email.trim());
    fd.append('role', this.form.role);
    const target = this.editing();
    if (!target) fd.append('password', this.form.password);
    const req = target ? this.api.updateUser(target._id, fd) : this.api.createUser(fd);
    req.subscribe({
      next: () => {
        this.toast.success(target ? 'User updated' : 'User created');
        this.saving.set(false);
        this.close();
        this.load();
      },
      error: (e) => {
        this.formError.set(apiError(e, 'Save failed'));
        this.saving.set(false);
      },
    });
  }

  async remove(u: User): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `Delete “${u.name}”? This removes their account.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteUser(u._id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.load();
      },
      error: (e) => this.toast.error(apiError(e, 'Delete failed')),
    });
  }
}
