import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Brand, Category, Product, ProductQuery } from '../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent, PaginationComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

// Storefront home: hero + search + filter rail + product grid + pagination.
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent, PaginationComponent],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <p class="eyebrow">Shop talabat</p>
        <h1>Everything you need, delivered fast.</h1>
        <p>Browse the full catalog by category, brand, or price. Thousands of products, one quick checkout.</p>
        <form class="hero-search" (ngSubmit)="search()">
          <input class="input" placeholder="Search products…" [(ngModel)]="keyword" name="keyword" aria-label="Search products" />
          <button class="btn" type="submit">Search</button>
        </form>
      </div>
    </section>

    <div class="container">
      <div class="shop">
        <aside class="filters">
        <div class="filter-group">
          <h4>Category</h4>
          <div class="stack" style="gap:.4rem">
            <button class="chip" [class.active]="!q.category" (click)="setCategory(undefined)">All</button>
            @for (c of categories(); track c._id) {
              <button class="chip" [class.active]="q.category === c._id" (click)="setCategory(c._id)">{{ c.name }}</button>
            }
          </div>
        </div>

        <div class="filter-group">
          <h4>Brand</h4>
          <select class="select" [(ngModel)]="q.brand" (change)="applyFilters()">
            <option [ngValue]="undefined">All brands</option>
            @for (b of brands(); track b._id) {
              <option [ngValue]="b._id">{{ b.name }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <h4>Price</h4>
          <div class="row" style="gap:.5rem">
            <input class="input" type="number" min="0" placeholder="Min" [(ngModel)]="minPrice" aria-label="Minimum price" />
            <input class="input" type="number" min="0" placeholder="Max" [(ngModel)]="maxPrice" aria-label="Maximum price" />
          </div>
          <button class="btn btn-ghost btn-sm btn-block mt-1" (click)="applyFilters()">Apply</button>
        </div>

        <div class="filter-group">
          <h4>Sort</h4>
          <select class="select" [(ngModel)]="q.sort" (change)="applyFilters()">
            <option [ngValue]="undefined">Newest</option>
            <option value="price">Price: low to high</option>
            <option value="-price">Price: high to low</option>
            <option value="title">Name: A–Z</option>
            <option value="-ratingsAverage">Top rated</option>
          </select>
        </div>

        @if (hasFilters()) {
          <button class="link-btn" (click)="clearFilters()">Clear all filters</button>
        }
      </aside>

        <div class="shop-main">
          <app-error [message]="error()" />
          @if (loading()) {
          <app-spinner />
        } @else if (products().length === 0) {
          <app-empty mark="◇" title="No products found" message="Try a different search or clear the filters." />
        } @else {
          <div class="row mb-2">
            <span class="muted" style="font-size:.9rem">{{ total() }} product{{ total() === 1 ? '' : 's' }}</span>
          </div>
          <div class="grid">
            @for (p of products(); track p._id) {
              <a class="product-card" [routerLink]="['/products', p._id]">
                <div class="product-media">
                  @if (discountPct(p); as pct) {
                    <span class="deal-badge">-{{ pct }}%</span>
                  }
                  @if (p.imageCover) {
                    <img [src]="p.imageCover" [alt]="p.title" loading="lazy" />
                  } @else {
                    <div class="ph">{{ p.title.charAt(0) }}</div>
                  }
                  @if (p.quantity != null && p.quantity <= 0) {
                    <span class="oos-badge">Out of stock</span>
                  }
                </div>
                <div class="product-body">
                  @if (catName(p)) {
                    <span class="product-cat">{{ catName(p) }}</span>
                  }
                  <span class="product-title">{{ p.title }}</span>
                  <div class="spacer"></div>
                  <div class="row" style="gap:.5rem;justify-content:space-between">
                    <span>
                      <span class="price">{{ (p.priceAfterDiscount ?? p.price) | currency }}</span>
                      @if (p.priceAfterDiscount != null && p.price != null) {
                        <span class="price-old">{{ p.price | currency }}</span>
                      }
                    </span>
                    @if (p.ratingsAverage) {
                      <span class="rating"><span class="star">★</span>{{ p.ratingsAverage }}</span>
                    }
                  </div>
                </div>
              </a>
            }
          </div>
          <app-pagination [current]="q.page || 1" [totalPages]="totalPages()" (pageChange)="goPage($event)" />
        }
        </div>
      </div>
    </div>
  `,
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  keyword = '';
  minPrice?: number;
  maxPrice?: number;
  q: ProductQuery = { page: 1, limit: 12 };

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (r) => this.categories.set(r.data.docs) });
    this.api.getBrands().subscribe({ next: (r) => this.brands.set(r.data.docs) });
    // Honor ?category / ?brand deep links from the categories/brands pages.
    const qp = this.route.snapshot.queryParamMap;
    const category = qp.get('category') ?? undefined;
    const brand = qp.get('brand') ?? undefined;
    if (category) this.q.category = category;
    if (brand) this.q.brand = brand;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getProducts(this.q).subscribe({
      next: (r) => {
        this.products.set(r.data.docs);
        this.total.set(r.results);
        this.totalPages.set(r.pagination.numberOfPages || 1);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load products'));
        this.loading.set(false);
      },
    });
  }

  search(): void {
    this.q = { ...this.q, keyword: this.keyword.trim() || undefined, page: 1 };
    this.load();
  }

  setCategory(id?: string): void {
    this.q = { ...this.q, category: id, page: 1 };
    this.load();
  }

  applyFilters(): void {
    this.q = {
      ...this.q,
      priceGte: this.minPrice != null && this.minPrice >= 0 ? this.minPrice : undefined,
      priceLte: this.maxPrice != null && this.maxPrice >= 0 ? this.maxPrice : undefined,
      page: 1,
    };
    this.load();
  }

  clearFilters(): void {
    this.keyword = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.q = { page: 1, limit: 12 };
    this.load();
  }

  hasFilters(): boolean {
    return !!(this.q.category || this.q.brand || this.q.keyword || this.q.sort || this.q.priceGte != null || this.q.priceLte != null);
  }

  goPage(p: number): void {
    this.q = { ...this.q, page: p };
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  catName(p: Product): string | null {
    if (p.category && typeof p.category === 'object') return p.category.name;
    return null;
  }

  discountPct(p: Product): number | null {
    if (p.price != null && p.priceAfterDiscount != null && p.price > 0) {
      return Math.round(((p.price - p.priceAfterDiscount) / p.price) * 100);
    }
    return null;
  }
}
