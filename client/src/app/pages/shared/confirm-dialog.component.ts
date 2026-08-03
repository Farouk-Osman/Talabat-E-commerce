import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (dialog.state(); as s) {
      <div class="modal-backdrop" (click)="dialog.resolveChoice(false)">
        <div class="modal" style="max-width:400px" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{ s.title }}</h3>
          </div>
          <div class="modal-body">
            <p class="muted">{{ s.message }}</p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" (click)="dialog.resolveChoice(false)">Cancel</button>
            <button class="btn" [class.btn-danger]="s.danger" (click)="dialog.resolveChoice(true)">
              {{ s.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);
}
