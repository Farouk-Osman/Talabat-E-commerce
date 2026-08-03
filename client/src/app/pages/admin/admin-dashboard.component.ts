import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { SpinnerComponent } from '../shared/ui.components';

// At-a-glance counts pulled from each list endpoint's `results`.
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, SpinnerComponent],
  template: `
    @if (loading()) {
      <app-spinner />
    } @else {
      <div class="stat-grid">
        <a class="stat" routerLink="/admin/products" style="text-decoration:none">
          <div class="k">Products</div>
          <div class="v">{{ counts().products }}</div>
        </a>
        <a class="stat" routerLink="/admin/categories" style="text-decoration:none">
          <div class="k">Categories</div>
          <div class="v">{{ counts().categories }}</div>
        </a>
        <a class="stat" routerLink="/admin/subcategories" style="text-decoration:none">
          <div class="k">Subcategories</div>
          <div class="v">{{ counts().subcategories }}</div>
        </a>
        <a class="stat" routerLink="/admin/brands" style="text-decoration:none">
          <div class="k">Brands</div>
          <div class="v">{{ counts().brands }}</div>
        </a>
        <a class="stat" routerLink="/admin/users" style="text-decoration:none">
          <div class="k">Users</div>
          <div class="v">{{ counts().users }}</div>
        </a>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  readonly loading = signal(true);
  readonly counts = signal({ products: 0, categories: 0, subcategories: 0, brands: 0, users: 0 });

  ngOnInit(): void {
    // Fire all counts in parallel; limit=1 keeps payloads tiny (we only need `results`).
    Promise.all([
      this.count((c) => this.api.getProducts({ limit: 1 }).subscribe(c)),
      this.count((c) => this.api.getCategories(1, 1).subscribe(c)),
      this.count((c) => this.api.getSubCategories(undefined, 1, 1).subscribe(c)),
      this.count((c) => this.api.getBrands(1, 1).subscribe(c)),
      this.count((c) => this.api.getUsers(1, 1).subscribe(c)),
    ]).then(([products, categories, subcategories, brands, users]) => {
      this.counts.set({ products, categories, subcategories, brands, users });
      this.loading.set(false);
    });
  }

  // Wrap a list call in a promise that resolves with its `results` count.
  private count(run: (cb: { next: (r: { results: number }) => void; error: () => void }) => void): Promise<number> {
    return new Promise((resolve) => {
      run({ next: (r) => resolve(r.results ?? 0), error: () => resolve(0) });
    });
  }
}
