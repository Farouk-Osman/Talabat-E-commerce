import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Brand } from '../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

// Browse brands; each links to the shop filtered by that brand.
@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [RouterLink, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="eyebrow">Browse</p>
        <h1>Brands</h1>
        <p>The makers we carry.</p>
      </div>

      <app-error [message]="error()" />
      @if (loading()) {
        <app-spinner />
      } @else if (brands().length === 0) {
        <app-empty mark="◇" title="No brands yet" message="Brands will appear here once added." />
      } @else {
        <div class="grid">
          @for (b of brands(); track b._id) {
            <a class="brand-tile" [routerLink]="['/']" [queryParams]="{ brand: b._id }">
              @if (b.image) {
                <img class="logo" [src]="b.image" [alt]="b.name" loading="lazy" />
              } @else {
                <div class="logo-ph">{{ b.name.charAt(0) }}</div>
              }
              <span class="b-name">{{ b.name }}</span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class BrandsComponent implements OnInit {
  private api = inject(ApiService);
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getBrands().subscribe({
      next: (r) => {
        this.brands.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load brands'));
        this.loading.set(false);
      },
    });
  }
}
