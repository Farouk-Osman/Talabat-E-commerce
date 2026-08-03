import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guard';

export const routes: Routes = [
  // ---- storefront ----
  {
    path: '',
    loadComponent: () => import('./pages/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-detail.component').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories.component').then((m) => m.CategoriesComponent),
  },
  {
    path: 'brands',
    loadComponent: () => import('./pages/brands.component').then((m) => m.BrandsComponent),
  },
  {
    path: 'subcategories',
    loadComponent: () => import('./pages/subcategories.component').then((m) => m.SubcategoriesComponent),
  },

  // ---- auth ----
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },

  // ---- self-service ----
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile.component').then((m) => m.ProfileComponent),
  },

  // ---- admin ----
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/admin-categories.component').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'subcategories',
        loadComponent: () => import('./pages/admin/admin-subcategories.component').then((m) => m.AdminSubcategoriesComponent),
      },
      {
        path: 'brands',
        loadComponent: () => import('./pages/admin/admin-brands.component').then((m) => m.AdminBrandsComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/admin-users.component').then((m) => m.AdminUsersComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
