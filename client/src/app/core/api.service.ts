import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiItem,
  ApiList,
  ApiMessage,
  AuthResponse,
  Brand,
  Category,
  Product,
  ProductQuery,
  SubCategory,
  User,
} from './models';

// Thin wrapper over the CRUD endpoints. List responses unwrap data.docs.
// All image fields come back as absolute URLs (backend rewrites them).
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- categories ----
  getCategories(page = 1, limit = 100): Observable<ApiList<Category>> {
    return this.http.get<ApiList<Category>>(
      `${this.api}/categories?page=${page}&limit=${limit}`
    );
  }
  getCategory(id: string): Observable<ApiItem<Category>> {
    return this.http.get<ApiItem<Category>>(`${this.api}/categories/${id}`);
  }
  createCategory(body: Partial<Category>): Observable<ApiItem<Category>> {
    return this.http.post<ApiItem<Category>>(`${this.api}/categories`, body);
  }
  updateCategory(id: string, body: Partial<Category>): Observable<ApiItem<Category>> {
    return this.http.put<ApiItem<Category>>(`${this.api}/categories/${id}`, body);
  }
  deleteCategory(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/categories/${id}`);
  }

  // ---- brands ----
  getBrands(page = 1, limit = 100): Observable<ApiList<Brand>> {
    return this.http.get<ApiList<Brand>>(
      `${this.api}/brands?page=${page}&limit=${limit}`
    );
  }
  createBrand(body: FormData): Observable<ApiItem<Brand>> {
    return this.http.post<ApiItem<Brand>>(`${this.api}/brands`, body);
  }
  updateBrand(id: string, body: FormData): Observable<ApiItem<Brand>> {
    return this.http.put<ApiItem<Brand>>(`${this.api}/brands/${id}`, body);
  }
  deleteBrand(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/brands/${id}`);
  }

  // ---- subcategories ----
  getSubCategories(categoryId?: string, page = 1, limit = 100): Observable<ApiList<SubCategory>> {
    let url = `${this.api}/subcategories?page=${page}&limit=${limit}`;
    if (categoryId) url += `&category=${categoryId}`;
    return this.http.get<ApiList<SubCategory>>(url);
  }
  createSubCategory(body: Partial<SubCategory>): Observable<ApiItem<SubCategory>> {
    return this.http.post<ApiItem<SubCategory>>(`${this.api}/subcategories`, body);
  }
  updateSubCategory(id: string, body: Partial<SubCategory>): Observable<ApiItem<SubCategory>> {
    return this.http.put<ApiItem<SubCategory>>(`${this.api}/subcategories/${id}`, body);
  }
  deleteSubCategory(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/subcategories/${id}`);
  }

  // ---- products ----
  getProducts(q: ProductQuery = {}): Observable<ApiList<Product>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', q.page);
    if (q.limit) params = params.set('limit', q.limit);
    if (q.keyword) params = params.set('keyword', q.keyword);
    if (q.category) params = params.set('category', q.category);
    if (q.brand) params = params.set('brand', q.brand);
    if (q.sort) params = params.set('sort', q.sort);
    // apiFeatures supports gte/lte operators on any field.
    if (q.priceGte != null) params = params.set('price[gte]', q.priceGte);
    if (q.priceLte != null) params = params.set('price[lte]', q.priceLte);
    return this.http.get<ApiList<Product>>(`${this.api}/products`, { params });
  }
  getProduct(id: string): Observable<ApiItem<Product>> {
    return this.http.get<ApiItem<Product>>(`${this.api}/products/${id}`);
  }
  createProduct(body: FormData): Observable<ApiItem<Product>> {
    return this.http.post<ApiItem<Product>>(`${this.api}/products`, body);
  }
  updateProduct(id: string, body: FormData): Observable<ApiItem<Product>> {
    return this.http.put<ApiItem<Product>>(`${this.api}/products/${id}`, body);
  }
  deleteProduct(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/products/${id}`);
  }

  // ---- auth ----
  forgotPassword(email: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/auth/forgotPassword`, { email });
  }
  verifyResetCode(resetCode: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/auth/verifyResetCode`, { resetCode });
  }
  resetPassword(email: string, newPassword: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.api}/auth/resetPassword`, {
      email,
      newPassword,
    });
  }

  // ---- user self-service ----
  getMe(): Observable<{ status: string; data: { user: User } }> {
    return this.http.get<{ status: string; data: { user: User } }>(`${this.api}/users/me`);
  }
  updateMe(body: FormData): Observable<ApiItem<User>> {
    return this.http.put<ApiItem<User>>(`${this.api}/users/updateMe`, body);
  }
  updateMyPassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.api}/users/updateMyPassword`, {
      currentPassword,
      newPassword,
    });
  }
  deleteMe(): Observable<unknown> {
    return this.http.delete(`${this.api}/users/deleteMe`);
  }

  // ---- admin: users ----
  getUsers(page = 1, limit = 100): Observable<ApiList<User>> {
    return this.http.get<ApiList<User>>(
      `${this.api}/users?page=${page}&limit=${limit}`
    );
  }
  createUser(body: FormData): Observable<ApiItem<User>> {
    return this.http.post<ApiItem<User>>(`${this.api}/users`, body);
  }
  updateUser(id: string, body: FormData): Observable<ApiItem<User>> {
    return this.http.put<ApiItem<User>>(`${this.api}/users/${id}`, body);
  }
  deleteUser(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/users/${id}`);
  }
}
