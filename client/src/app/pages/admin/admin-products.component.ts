import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Brand, Category, Product, SubCategory } from '../../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent, PaginationComponent } from '../shared/ui.components';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { apiError } from '../shared/errors';

interface ProductForm {
  title: string;
  description: string;
  price: number | null;
  priceAfterDiscount: number | null;
  quantity: number | null;
  category: string;
  brand: string;
  subcategories: string[];
  colors: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent, PaginationComponent],
  template: `
    <div class="row mb-2">
      <h2>Products</h2>
      <div class="spacer"></div>
      <button class="btn" (click)="openCreate()" [disabled]="!canCreate()">+ New product</button>
    </div>

    @if (!canCreate() && !loading()) {
      <div class="alert alert-info">Add at least one category and one brand before creating products.</div>
    }

    <app-error [message]="error()" />
    @if (loading()) {
      <app-spinner />
    } @else if (items().length === 0) {
      <app-empty title="No products" message="Create your first product listing." />
    } @else {
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th></th><th>Title</th><th>Price</th><th>Qty</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            @for (p of items(); track p._id) {
              <tr>
                <td>
                  @if (p.imageCover) { <img class="thumb" [src]="p.imageCover" [alt]="p.title" /> }
                  @else { <div class="thumb" style="display:grid;place-items:center;color:var(--ink-faint)">{{ p.title.charAt(0) }}</div> }
                </td>
                <td><strong>{{ p.title }}</strong></td>
                <td>{{ (p.priceAfterDiscount ?? p.price) | currency }}</td>
                <td class="muted">{{ p.quantity }}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(p)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="remove(p)">Delete</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [current]="page()" [totalPages]="totalPages()" (pageChange)="goPage($event)" />
    }

    @if (showModal()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3>{{ editing() ? 'Edit product' : 'New product' }}</h3>
            <button class="icon-btn" (click)="close()" aria-label="Close">×</button>
          </div>
          <form (ngSubmit)="save()">
            <div class="modal-body">
              <app-error [message]="formError()" />
              <div class="field">
                <label for="title">Title</label>
                <input class="input" id="title" [(ngModel)]="form.title" name="title" required />
              </div>
              <div class="field">
                <label for="desc">Description</label>
                <textarea class="textarea" id="desc" [(ngModel)]="form.description" name="desc" required maxlength="500"></textarea>
              </div>
              <div class="form-grid">
                <div class="field">
                  <label for="price">Price</label>
                  <input class="input" id="price" type="number" min="0" step="0.01" [(ngModel)]="form.price" name="price" required />
                </div>
                <div class="field">
                  <label for="disc">Discounted price</label>
                  <input class="input" id="disc" type="number" min="0" step="0.01" [(ngModel)]="form.priceAfterDiscount" name="disc" />
                </div>
                <div class="field">
                  <label for="qty">Quantity</label>
                  <input class="input" id="qty" type="number" min="0" [(ngModel)]="form.quantity" name="qty" required />
                </div>
                <div class="field">
                  <label for="colors">Colors</label>
                  <input class="input" id="colors" [(ngModel)]="form.colors" name="colors" placeholder="red, blue" />
                </div>
                <div class="field">
                  <label for="cat">Category</label>
                  <select class="select" id="cat" [(ngModel)]="form.category" name="cat" required (change)="onCategoryChange()">
                    <option value="" disabled>Select</option>
                    @for (c of categories(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
                  </select>
                </div>
                <div class="field">
                  <label for="brand">Brand</label>
                  <select class="select" id="brand" [(ngModel)]="form.brand" name="brand" required>
                    <option value="" disabled>Select</option>
                    @for (b of brands(); track b._id) { <option [value]="b._id">{{ b.name }}</option> }
                  </select>
                </div>
              </div>

              @if (subcategories().length > 0) {
                <div class="field">
                  <label>Subcategories</label>
                  <div class="row row-wrap">
                    @for (s of subcategories(); track s._id) {
                      <button type="button" class="chip" [class.active]="form.subcategories.includes(s._id)" (click)="toggleSub(s._id)">
                        {{ s.name }}
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="form-grid">
                <div class="field">
                  <label>Cover image {{ editing() ? '' : '(required)' }}</label>
                  <label class="file-drop">
                    {{ coverFile ? coverFile.name : 'Choose cover' }}
                    <input type="file" accept="image/*" hidden (change)="onCover($event)" />
                  </label>
                  @if (coverPreview()) {
                    <div class="file-preview"><img [src]="coverPreview()!" alt="Cover preview" /></div>
                  }
                </div>
                <div class="field">
                  <label>Gallery images</label>
                  <label class="file-drop">
                    {{ imageFiles.length ? imageFiles.length + ' selected' : 'Choose images' }}
                    <input type="file" accept="image/*" multiple hidden (change)="onImages($event)" />
                  </label>
                  @if (imagesPreview().length) {
                    <div class="file-preview">
                      @for (img of imagesPreview(); track img) { <img [src]="img" alt="Gallery preview" /> }
                    </div>
                  }
                </div>
              </div>
              @if (!editing()) {
                <p class="field-hint">A cover image is required when creating a product.</p>
              }
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
              <button type="submit" class="btn" [disabled]="saving() || (!editing() && !coverFile)">
                {{ saving() ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminProductsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  readonly items = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly subcategories = signal<SubCategory[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly showModal = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly coverPreview = signal<string | null>(null);
  readonly imagesPreview = signal<string[]>([]);

  form: ProductForm = this.blankForm();
  coverFile: File | null = null;
  imageFiles: File[] = [];

  blankForm(): ProductForm {
    return {
      title: '',
      description: '',
      price: null,
      priceAfterDiscount: null,
      quantity: null,
      category: '',
      brand: '',
      subcategories: [],
      colors: '',
    };
  }

  canCreate(): boolean {
    return this.categories().length > 0 && this.brands().length > 0;
  }

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (r) => this.categories.set(r.data.docs) });
    this.api.getBrands().subscribe({ next: (r) => this.brands.set(r.data.docs) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getProducts({ page: this.page(), limit: 10 }).subscribe({
      next: (r) => {
        this.items.set(r.data.docs);
        this.totalPages.set(r.pagination.numberOfPages || 1);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load products'));
        this.loading.set(false);
      },
    });
  }

  goPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  // ---- modal open/close ----
  openCreate(): void {
    this.editing.set(null);
    this.form = this.blankForm();
    this.resetFiles();
    this.subcategories.set([]);
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(p: Product): void {
    this.editing.set(p);
    const categoryId = typeof p.category === 'object' ? p.category._id : (p.category ?? '');
    const brandId = typeof p.brand === 'object' ? p.brand._id : (p.brand ?? '');
    this.form = {
      title: p.title,
      description: p.description ?? '',
      price: p.price ?? null,
      priceAfterDiscount: p.priceAfterDiscount ?? null,
      quantity: p.quantity ?? null,
      category: categoryId,
      brand: brandId,
      subcategories: [],
      colors: (p.colors ?? []).join(', '),
    };
    this.resetFiles();
    this.coverPreview.set(p.imageCover ?? null);
    this.imagesPreview.set(p.images ?? []);
    this.formError.set(null);
    if (categoryId) this.loadSubs(categoryId);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  private resetFiles(): void {
    this.coverFile = null;
    this.imageFiles = [];
    this.coverPreview.set(null);
    this.imagesPreview.set([]);
  }

  // Load subcategories for the chosen category (for the multi-select).
  loadSubs(categoryId: string): void {
    if (!categoryId) {
      this.subcategories.set([]);
      return;
    }
    this.api.getSubCategories(categoryId).subscribe({
      next: (r) => this.subcategories.set(r.data.docs),
    });
  }

  onCategoryChange(): void {
    this.form.subcategories = [];
    this.loadSubs(this.form.category);
  }

  onCover(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverFile = file;
    this.coverPreview.set(URL.createObjectURL(file));
  }

  onImages(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.imageFiles = files;
    this.imagesPreview.set(files.map((f) => URL.createObjectURL(f)));
  }

  toggleSub(id: string): void {
    const set = new Set(this.form.subcategories);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.form.subcategories = Array.from(set);
  }

  save(): void {
    this.saving.set(true);
    this.formError.set(null);
    const fd = new FormData();
    fd.append('title', this.form.title.trim());
    fd.append('description', this.form.description.trim());
    if (this.form.price != null) fd.append('price', String(this.form.price));
    if (this.form.priceAfterDiscount != null) fd.append('priceAfterDiscount', String(this.form.priceAfterDiscount));
    if (this.form.quantity != null) fd.append('quantity', String(this.form.quantity));
    fd.append('category', this.form.category);
    fd.append('brand', this.form.brand);
    this.form.subcategories.forEach((s) => fd.append('subcategories', s));
    this.form.colors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => fd.append('colors', c));
    if (this.coverFile) fd.append('imageCover', this.coverFile);
    this.imageFiles.forEach((f) => fd.append('images', f));

    const target = this.editing();
    const req = target ? this.api.updateProduct(target._id, fd) : this.api.createProduct(fd);
    req.subscribe({
      next: () => {
        this.toast.success(target ? 'Product updated' : 'Product created');
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

  async remove(p: Product): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `Delete “${p.title}”?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteProduct(p._id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.load();
      },
      error: (e) => this.toast.error(apiError(e, 'Delete failed')),
    });
  }
}
