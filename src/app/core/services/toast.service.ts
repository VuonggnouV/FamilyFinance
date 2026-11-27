import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'undo';
  title: string;
  message: string;
  durationMs: number;
  remainingMs: number;
  progressPercent: number;
  undoLabel?: string;
  onUndo?: () => Promise<void> | void;
  undoing?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  private timers = new Map<string, ReturnType<typeof setInterval>>();

  private idCounter = 0;

  private generateId(): string {
    this.idCounter++;
    return `toast-${Date.now()}-${this.idCounter}-${Math.random().toString(36).slice(2, 7)}`;
  }

  show(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    durationMs = 4000
  ): void {
    const id = this.generateId();
    const item: ToastItem = {
      id,
      type,
      title,
      message,
      durationMs,
      remainingMs: durationMs,
      progressPercent: 100,
    };
    this.toasts.update((list) => [item, ...list]);
    this.startTimer(id, durationMs);
  }

  /**
   * 10-second game HP bar countdown toast with [Ấy khoan! Quay xe (Undo)] button
   */
  showUndo(
    title: string,
    message: string,
    onUndo: () => Promise<void> | void,
    durationMs = 10000,
    undoLabel = 'Ấy khoan! Quay xe (Undo)'
  ): void {
    const id = this.generateId();
    const item: ToastItem = {
      id,
      type: 'undo',
      title,
      message,
      durationMs,
      remainingMs: durationMs,
      progressPercent: 100,
      undoLabel,
      onUndo,
      undoing: false,
    };
    this.toasts.update((list) => [item, ...list]);
    this.startTimer(id, durationMs);
  }

  async triggerUndo(item: ToastItem): Promise<void> {
    if (!item.onUndo || item.undoing) return;
    this.clearTimer(item.id);
    this.toasts.update((list) =>
      list.map((t) => (t.id === item.id ? { ...t, undoing: true } : t))
    );
    try {
      await item.onUndo();
      this.dismiss(item.id);
    } catch (err: any) {
      this.dismiss(item.id);
      this.show(
        'error',
        'Hết giờ quay xe rồi! ⏰',
        err?.message || 'Đã quá 10 giây nên hệ thống khóa giao dịch vĩnh viễn.'
      );
    }
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private startTimer(id: string, durationMs: number): void {
    const stepMs = 100;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      const pct = Math.max(0, (remaining / durationMs) * 100);

      if (remaining <= 0) {
        this.dismiss(id);
      } else {
        this.toasts.update((list) =>
          list.map((t) =>
            t.id === id
              ? { ...t, remainingMs: remaining, progressPercent: pct }
              : t
          )
        );
      }
    }, stepMs);

    this.timers.set(id, interval);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }
}
