import { Component, EventEmitter, Input, Output } from '@angular/core';

// Loading placeholder — shimmer skeleton grid (falls back to a spinner if
// used outside a content grid).
@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="sk-grid" role="status" aria-label="Loading">
      @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
        <div class="sk-card">
          <div class="sk sk-img"></div>
          <div class="sk sk-line w60"></div>
          <div class="sk sk-line w40"></div>
        </div>
      }
    </div>
  `,
})
export class SpinnerComponent {}

// Empty state with an optional call to action.
@Component({
  selector: 'app-empty',
  standalone: true,
  template: `
    <div class="empty">
      <div class="mark">{{ mark }}</div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() mark = '∅';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
}

// Inline error alert.
@Component({
  selector: 'app-error',
  standalone: true,
  template: `
    @if (message) {
      <div class="alert alert-error" role="alert">
        <span>{{ message }}</span>
      </div>
    }
  `,
})
export class ErrorAlertComponent {
  @Input() message: string | null = null;
}

// Numeric pagination driven by the API's pagination envelope.
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button [disabled]="current <= 1" (click)="go(current - 1)" aria-label="Previous page">‹</button>
        @for (p of pages(); track p) {
          <button [class.active]="p === current" (click)="go(p)">{{ p }}</button>
        }
        <button [disabled]="current >= totalPages" (click)="go(current + 1)" aria-label="Next page">›</button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  @Input() current = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  // Show a compact window of page numbers around the current page.
  pages(): number[] {
    const total = this.totalPages;
    const span = 2;
    const start = Math.max(1, this.current - span);
    const end = Math.min(total, this.current + span);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  go(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.current) return;
    this.pageChange.emit(p);
  }
}
