import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ToastsComponent } from './pages/shared/toasts.component';
import { ConfirmDialogComponent } from './pages/shared/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent, ConfirmDialogComponent],
  template: `
    <nav class="nav">
      <div class="nav-inner">
        <a class="brand" routerLink="/">talabat<span class="dot">.</span></a>
        <div class="nav-links" [class.open]="menuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOpen = false">Shop</a>
          <a routerLink="/categories" routerLinkActive="active" (click)="menuOpen = false">Categories</a>
          <a routerLink="/brands" routerLinkActive="active" (click)="menuOpen = false">Brands</a>
          <a routerLink="/subcategories" routerLinkActive="active" (click)="menuOpen = false">Subcategories</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" (click)="menuOpen = false">Admin</a>
          }
          <div class="nav-spacer"></div>
          @if (auth.isLoggedIn()) {
            <a routerLink="/profile" routerLinkActive="active" (click)="menuOpen = false">{{ auth.user()?.name }}</a>
            <a href="#" class="nav-logout" (click)="logout($event)">Logout</a>
          } @else {
            <a routerLink="/login" routerLinkActive="active" (click)="menuOpen = false">Log in</a>
            <a routerLink="/signup" (click)="menuOpen = false">Sign up</a>
          }
        </div>
        <button class="nav-toggle" (click)="menuOpen = !menuOpen" aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            @if (!menuOpen) {
              <path d="M3 6h18M3 12h18M3 18h18" />
            } @else {
              <path d="M6 6l12 12M18 6L6 18" />
            }
          </svg>
        </button>
      </div>
    </nav>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <a class="brand" routerLink="/">talabat<span class="dot">.</span></a>
          <p class="footer-tag">A fast, friendly way to shop everything — categories, brands, and products in one place.</p>
        </div>
        <nav class="footer-col" aria-label="Shop">
          <h4>Shop</h4>
          <a routerLink="/">Products</a>
          <a routerLink="/categories">Categories</a>
          <a routerLink="/brands">Brands</a>
          <a routerLink="/subcategories">Subcategories</a>
        </nav>
        <nav class="footer-col" aria-label="Account">
          <h4>Account</h4>
          @if (auth.isLoggedIn()) {
            <a routerLink="/profile">Profile</a>
            <a href="#" (click)="logout($event)">Sign out</a>
          } @else {
            <a routerLink="/login">Sign in</a>
            <a routerLink="/signup">Create account</a>
          }
        </nav>
        <div class="footer-note">
          <p>This is a personal learning project — a Talabat-style storefront built on the MEAN stack. Not affiliated with Talabat.</p>
        </div>
      </div>
    </footer>

    <app-toasts />
    <app-confirm-dialog />
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  menuOpen = false;

  logout(e: Event): void {
    e.preventDefault();
    this.menuOpen = false;
    this.auth.logout();
  }
}
