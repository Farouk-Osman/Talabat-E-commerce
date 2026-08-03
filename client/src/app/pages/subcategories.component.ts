import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Category, SubCategory } from '../core/models';
import { SpinnerComponent, EmptyStateComponent, ErrorAlertComponent } from './shared/ui.components';
import { apiError } from './shared/errors';

interface SubGroup {
  categoryId: string;
  categoryName: string;
  subs: SubCategory[];
}

// Browse subcategories grouped by their parent department.
// Each chip deep-links to the shop filtered by that category.
@Component({
  selector: 'app-subcategories',
  standalone: true,
  imports: [RouterLink, SpinnerComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="eyebrow">Browse</p>
        <h1>Subcategories</h1>
        <p>Finer groupings within each department. Tap one to shop its category.</p>
      </div>

      <app-error [message]="error()" />
      @if (loading()) {
        <app-spinner />
      } @else if (subs().length === 0) {
        <app-empty mark="◇" title="No subcategories yet" message="Subcategories will appear here once added." />
      } @else {
        <div class="stack" style="gap:1.75rem">
          @for (g of groups(); track g.categoryId) {
            <div class="subcat-group">
              <div class="subcat-group-head">
                <h3>{{ g.categoryName }}</h3>
                @if (g.categoryId) {
                  <a class="link-btn" [routerLink]="['/']" [queryParams]="{ category: g.categoryId }">Shop all →</a>
                }
              </div>
              <div class="row row-wrap">
                @for (s of g.subs; track s._id) {
                  <a class="chip" [routerLink]="['/']" [queryParams]="{ category: g.categoryId }">{{ s.name }}</a>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SubcategoriesComponent implements OnInit {
  private api = inject(ApiService);
  readonly subs = signal<SubCategory[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Group subcategories under their parent category (handles populated or id-only category).
  readonly groups = computed<SubGroup[]>(() => {
    const catName = new Map(this.categories().map((c) => [c._id, c.name]));
    const byCat = new Map<string, SubGroup>();
    for (const s of this.subs()) {
      const cat = s.category;
      const id = cat && typeof cat === 'object' ? cat._id : (cat ?? '');
      const name =
        (cat && typeof cat === 'object' ? cat.name : catName.get(id)) ?? 'Other';
      if (!byCat.has(id)) byCat.set(id, { categoryId: id, categoryName: name, subs: [] });
      byCat.get(id)!.subs.push(s);
    }
    return [...byCat.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  });

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (r) => this.categories.set(r.data.docs) });
    this.api.getSubCategories().subscribe({
      next: (r) => {
        this.subs.set(r.data.docs);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e, 'Failed to load subcategories'));
        this.loading.set(false);
      },
    });
  }
}
