import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Product } from '../core/models';
import { SpinnerComponent, ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

// Single product: image gallery + details + specs.
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SpinnerComponent, ErrorAlertComponent],
  template: `
    <div class="page">
      <app-error [message]="error()" />
      @if (loading()) {
        <app-spinner />
      } @else {
        @if (product(); as p) {
          <p class="muted mb-2" style="font-size:.9rem">
            <a routerLink="/">Shop</a> ›
            @if (catName(p)) { <span>{{ catName(p) }} › </span> }
            {{ p.title }}
          </p>

          <div class="detail">
            <div>
              <div class="gallery-main">
                @if (activeImg()) {
                  <img [src]="activeImg()!" [alt]="p.title" />
                } @else {
                  <div class="product-media"><div class="ph">{{ p.title.charAt(0) }}</div></div>
                }
              </div>
              @if (allImages().length > 1) {
                <div class="gallery-thumbs">
                  @for (img of allImages(); track img) {
                    <img [src]="img" [alt]="p.title" [class.active]="img === activeImg()" (click)="activeImg.set(img)" />
                  }
                </div>
              }
            </div>

            <div>
              @if (catName(p)) { <p class="eyebrow">{{ catName(p) }}</p> }
              <h1>{{ p.title }}</h1>

              <div class="price-panel mt-2">
                <span class="detail-price">{{ (p.priceAfterDiscount ?? p.price) | currency }}</span>
                @if (p.priceAfterDiscount != null && p.price != null) {
                  <span class="price-old" style="font-size:1.1rem">{{ p.price | currency }}</span>
                  <span class="badge badge-danger">Save {{ savings(p) }}</span>
                }
              </div>

              <div class="row mt-2" style="gap:1rem">
                @if (p.ratingsAverage) {
                  <span class="rating"><span class="star">★</span>{{ p.ratingsAverage }} ({{ p.ratingsQuantity || 0 }})</span>
                }
                @if (inStock(p)) {
                  <span class="badge badge-success">In stock</span>
                } @else {
                  <span class="badge badge-danger">Out of stock</span>
                }
              </div>

              @if (p.description) {
                <div class="divider"></div>
                <p class="muted" style="line-height:1.7">{{ p.description }}</p>
              }

              @if (p.colors?.length) {
                <div class="mt-2">
                  <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-faint);margin-bottom:.5rem">Colors</h4>
                  <div class="row row-wrap">
                    @for (c of p.colors; track c) { <span class="chip">{{ c }}</span> }
                  </div>
                </div>
              }

              <div class="divider"></div>
              <dl class="detail-specs">
                @if (brandName(p)) {
                  <div class="spec-row"><dt>Brand</dt><dd>{{ brandName(p) }}</dd></div>
                }
                @if (p.quantity != null) {
                  <div class="spec-row"><dt>Available</dt><dd>{{ p.quantity }} units</dd></div>
                }
                @if (p.sold != null) {
                  <div class="spec-row"><dt>Sold</dt><dd>{{ p.sold }}</dd></div>
                }
              </dl>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeImg = signal<string | null>(null);

  readonly allImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const imgs: string[] = [];
    if (p.imageCover) imgs.push(p.imageCover);
    if (p.images?.length) imgs.push(...p.images);
    return imgs;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getProduct(id).subscribe({
      next: (r) => {
        this.product.set(r.data);
        this.activeImg.set(r.data.imageCover ?? r.data.images?.[0] ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Product not found'));
        this.loading.set(false);
      },
    });
  }

  catName(p: Product): string | null {
    return p.category && typeof p.category === 'object' ? p.category.name : null;
  }
  brandName(p: Product): string | null {
    return p.brand && typeof p.brand === 'object' ? p.brand.name : null;
  }
  inStock(p: Product): boolean {
    return (p.quantity ?? 0) > 0;
  }
  savings(p: Product): string {
    if (p.price == null || p.priceAfterDiscount == null) return '';
    const pct = Math.round(((p.price - p.priceAfterDiscount) / p.price) * 100);
    return `${pct}%`;
  }
}
