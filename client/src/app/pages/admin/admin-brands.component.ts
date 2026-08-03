import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Brand } from '../../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from '../shared/ui.components';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { apiError } from '../shared/errors';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="row mb-2">
      <h2>Brands</h2>
      <div class="spacer"></div>
      <button class="btn" (click)="openCreate()">+ New brand</button>
    </div>

    <app-error [message]="error()" />
    @if (loading()) {
      <app-spinner />
    } @else if (items().length === 0) {
      <app-empty title="No brands" message="Add a brand and give it a logo." />
    } @else {
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th></th><th>Name</th><th>Slug</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            @for (b of items(); track b._id) {
              <tr>
                <td>
                  @if (b.image) { <img class="thumb" [src]="b.image" [alt]="b.name" /> }
                  @else { <div class="thumb" style="display:grid;place-items:center;color:var(--ink-faint)">{{ b.name.charAt(0) }}</div> }
                </td>
                <td><strong>{{ b.name }}</strong></td>
                <td class="muted">{{ b.slug }}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(b)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="remove(b)">Delete</button>
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
            <h3>{{ editing() ? 'Edit brand' : 'New brand' }}</h3>
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
                <label>Logo</label>
                <label class="file-drop">
                  {{ imageFile ? imageFile.name : 'Choose an image' }}
                  <input type="file" accept="image/*" hidden (change)="onImage($event)" />
                </label>
                @if (preview()) {
                  <div class="file-preview"><img [src]="preview()!" alt="Preview" /></div>
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
export class AdminBrandsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly items = signal<Brand[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editing = signal<Brand | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly preview = signal<string | null>(null);

  name = '';
  imageFile: File | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getBrands().subscribe({
      next: (r) => {
        this.items.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load brands'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.name = '';
    this.imageFile = null;
    this.preview.set(null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(b: Brand): void {
    this.editing.set(b);
    this.name = b.name;
    this.imageFile = null;
    this.preview.set(b.image ?? null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  onImage(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile = file;
    this.preview.set(URL.createObjectURL(file));
  }

  save(): void {
    this.saving.set(true);
    this.formError.set(null);
    const fd = new FormData();
    fd.append('name', this.name.trim());
    if (this.imageFile) fd.append('image', this.imageFile);
    const target = this.editing();
    const req = target ? this.api.updateBrand(target._id, fd) : this.api.createBrand(fd);
    req.subscribe({
      next: () => {
        this.toast.success(target ? 'Brand updated' : 'Brand created');
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

  async remove(b: Brand): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `Delete “${b.name}”?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteBrand(b._id).subscribe({
      next: () => {
        this.toast.success('Brand deleted');
        this.load();
      },
      error: (e) => this.toast.error(apiError(e, 'Delete failed')),
    });
  }
}
