import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Category } from '../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

// Browse categories; each links to the shop filtered by that category.
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="eyebrow">Browse</p>
        <h1>Categories</h1>
        <p>Pick a department to narrow the catalog.</p>
      </div>

      <app-error [message]="error()" />
      @if (loading()) {
        <app-spinner />
      } @else if (categories().length === 0) {
        <app-empty mark="◇" title="No categories yet" message="Check back once the store is stocked." />
      } @else {
        <div class="grid">
          @for (c of categories(); track c._id) {
            <a class="tile" [routerLink]="['/']" [queryParams]="{ category: c._id }">
              @if (c.image) {
                <img [src]="c.image" [alt]="c.name" loading="lazy" />
              } @else {
                <div class="ph-tile">{{ c.name.charAt(0) }}</div>
              }
              <div class="scrim"></div>
              <span class="name">{{ c.name }}<span class="arrow">→</span></span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (r) => {
        this.categories.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load categories'));
        this.loading.set(false);
      },
    });
  }
}
