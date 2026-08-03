import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  // When state() is non-null the ConfirmDialogComponent shows a modal.
  readonly state = signal<ConfirmState | null>(null);
  private resolver: ((ok: boolean) => void) | null = null;

  // Returns a promise that resolves with the user's choice.
  confirm(options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    this.state.set({
      title: options.title ?? 'Are you sure?',
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      danger: options.danger ?? false,
    });
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  resolveChoice(ok: boolean): void {
    this.state.set(null);
    this.resolver?.(ok);
    this.resolver = null;
  }
}
