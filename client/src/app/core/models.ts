// Response envelopes returned by the API.
export interface ApiItem<T> {
  status: string;
  data: T;
}

export interface Pagination {
  currentPage: number;
  limit: number;
  numberOfPages: number;
  next?: number;
  prev?: number;
}

// List endpoints return data under data.docs plus results + pagination.
export interface ApiList<T> {
  status: string;
  results: number;
  pagination: Pagination;
  data: { docs: T[] };
}

// Error shape: validator errors OR a plain message.
export interface ApiErrorBody {
  message?: string;
  errors?: { msg: string; param?: string }[];
}

// Bare success responses like { status: 'success', message }.
export interface ApiMessage {
  status: string;
  message?: string;
  resetCode?: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: { user: User };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  profileImage?: string;
  active?: boolean;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug?: string;
  category?: string | Category;
}

// Summary shape used by list endpoints.
export interface Product {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  priceAfterDiscount?: number;
  imageCover?: string;
  images?: string[];
  quantity?: number;
  sold?: number;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  category?: string | { _id: string; name: string };
  brand?: string | { _id: string; name: string };
  colors?: string[];
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: string;
  brand?: string;
  sort?: string;
  priceGte?: number;
  priceLte?: number;
}
