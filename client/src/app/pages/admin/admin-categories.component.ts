import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Category } from '../../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from '../shared/ui.components';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { apiError } from '../shared/errors';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="row mb-2">
      <h2>Categories</h2>
      <div class="spacer"></div>
      <button class="btn" (click)="openCreate()">+ New category</button>
    </div>

    <app-error [message]="error()" />
    @if (loading()) {
      <app-spinner />
    } @else if (items().length === 0) {
      <app-empty title="No categories" message="Create your first category to get started." />
    } @else {
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Name</th><th>Slug</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            @for (c of items(); track c._id) {
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="muted">{{ c.slug }}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(c)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="remove(c)">Delete</button>
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
            <h3>{{ editing() ? 'Edit category' : 'New category' }}</h3>
            <button class="icon-btn" (click)="close()" aria-label="Close">×</button>
          </div>
          <form (ngSubmit)="save()">
            <div class="modal-body">
              <app-error [message]="formError()" />
              <div class="field">
                <label for="name">Name</label>
                <input class="input" id="name" [(ngModel)]="form.name" name="name" required />
                <span class="field-hint">3–50 characters.</span>
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
export class AdminCategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly items = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  form: { name: string } = { name: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: (r) => {
        this.items.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load categories'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '' };
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(c: Category): void {
    this.editing.set(c);
    this.form = { name: c.name };
    this.formError.set(null);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    this.saving.set(true);
    this.formError.set(null);
    const body = { name: this.form.name.trim() };
    const target = this.editing();
    const req = target
      ? this.api.updateCategory(target._id, body)
      : this.api.createCategory(body);
    req.subscribe({
      next: () => {
        this.toast.success(target ? 'Category updated' : 'Category created');
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

  async remove(c: Category): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `Delete “${c.name}”? Products in it may be affected.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteCategory(c._id).subscribe({
      next: () => {
        this.toast.success('Category deleted');
        this.load();
      },
      error: (e) => this.toast.error(apiError(e, 'Delete failed')),
    });
  }
}
