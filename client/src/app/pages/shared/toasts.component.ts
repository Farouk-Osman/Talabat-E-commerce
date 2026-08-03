import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

// Renders the active toasts. Mount once near the app root.
@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="true">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'">
          <span>{{ t.text }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  readonly toast = inject(ToastService);
}
