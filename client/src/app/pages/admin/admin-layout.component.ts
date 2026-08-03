import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Admin shell: tabbed navigation + routed child pages.
// Guarded by authGuard + adminGuard at the route level.
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="eyebrow">Control room</p>
        <h1>Admin</h1>
      </div>

      <nav class="admin-tabs">
        <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Dashboard</a>
        <a routerLink="/admin/products" routerLinkActive="active">Products</a>
        <a routerLink="/admin/categories" routerLinkActive="active">Categories</a>
        <a routerLink="/admin/subcategories" routerLinkActive="active">Subcategories</a>
        <a routerLink="/admin/brands" routerLinkActive="active">Brands</a>
        <a routerLink="/admin/users" routerLinkActive="active">Users</a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class AdminLayoutComponent {}
