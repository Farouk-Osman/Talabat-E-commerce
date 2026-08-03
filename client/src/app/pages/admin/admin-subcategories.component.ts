import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Category, SubCategory } from '../../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from '../shared/ui.components';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { apiError } from '../shared/errors';

@Component({
  selector: 'app-admin-subcategories',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="row mb-2">
      <h2>Subcategories</h2>
      <div class="spacer"></div>
      <button class="btn" (click)="openCreate()" [disabled]="categories().length === 0">+ New subcategory</button>
    </div>

    @if (categories().length === 0 && !loading()) {
      <div class="alert alert-info">Create a category first — every subcategory belongs to one.</div>
    }

    <app-error [message]="error()" />
    @if (loading()) {
      <app-spinner />
    } @else if (items().length === 0) {
      <app-empty title="No subcategories" message="Group products more finely within a category." />
    } @else {
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Name</th><th>Category</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            @for (s of items(); track s._id) {
              <tr>
                <td><strong>{{ s.name }}</strong></td>
                <td class="muted">{{ categoryName(s) }}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(s)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="remove(s)">Delete</button>
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
            <h3>{{ editing() ? 'Edit subcategory' : 'New subcategory' }}</h3>
            <button class="icon-btn" (click)="close()" aria-label="Close">×</button>
          </div>
          <form (ngSubmit)="save()">
            <div class="modal-body">
              <app-error [message]="formError()" />
              <div class="field">
                <label for="name">Name</label>
                <input class="input" id="name" [(ngModel)]="name" name="name" required />
                <span class="field-hint">3–50 characters.</span>
              </div>
              <div class="field">
                <label for="cat">Category</label>
                <select class="select" id="cat" [(ngModel)]="categoryId" name="cat" required>
                  <option value="" disabled>Select a category</option>
                  @for (c of categories(); track c._id) {
                    <option [value]="c._id">{{ c.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
              <button type="submit" class="btn" [disabled]="saving() || !categoryId">{{ saving() ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminSubcategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly items = signal<SubCategory[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editing = signal<SubCategory | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  name = '';
  categoryId = '';

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (r) => this.categories.set(r.data.docs) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getSubCategories().subscribe({
      next: (r) => {
        this.items.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load subcategories'));
        this.loading.set(false);
      },
    });
  }

  categoryName(s: SubCategory): string {
    if (s.category && typeof s.category === 'object') return s.category.name;
    const found = this.categories().find((c) => c._id === s.category);
    return found?.name ?? '—';
  }

  openCreate(): void {
    this.editing.set(null);
    this.name = '';
    this.categoryId = '';
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(s: SubCategory): void {
    this.editing.set(s);
    this.name = s.name;
    this.categoryId = typeof s.category === 'object' ? (s.category?._id ?? '') : (s.category ?? '');
    this.formError.set(null);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    this.saving.set(true);
    this.formError.set(null);
    const body = { name: this.name.trim(), category: this.categoryId };
    const target = this.editing();
    const req = target
      ? this.api.updateSubCategory(target._id, body)
      : this.api.createSubCategory(body);
    req.subscribe({
      next: () => {
        this.toast.success(target ? 'Subcategory updated' : 'Subcategory created');
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

  async remove(s: SubCategory): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `Delete “${s.name}”?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteSubCategory(s._id).subscribe({
      next: () => {
        this.toast.success('Subcategory deleted');
        this.load();
      },
      error: (e) => this.toast.error(apiError(e, 'Delete failed')),
    });
  }
}
