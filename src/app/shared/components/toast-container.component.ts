import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 left-4 md:left-auto md:w-[420px] z-[100] flex flex-col gap-3 pointer-events-none"
    >
      @for (t of toastService.toasts(); track t.id) {
        <div
          class="pointer-events-auto toy-card p-4 transition-all duration-200 relative overflow-hidden"
          [ngClass]="{
            'bg-[#DCFCE7]': t.type === 'success',
            'bg-[#FFE4E6]': t.type === 'error',
            'bg-[#FEF3C7]': t.type === 'warning',
            'bg-[#E0F2FE]': t.type === 'info',
            'bg-[#FFF9EC]': t.type === 'undo'
          }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-2.5 min-w-0">
              <span
                class="text-2xl select-none shrink-0"
                [class.animate-bell]="t.type === 'undo'"
              >
                @switch (t.type) {
                  @case ('success') { 🎉 }
                  @case ('error') { 🚨 }
                  @case ('warning') { ⚠️ }
                  @case ('info') { 💡 }
                  @case ('undo') { ⏰ }
                }
              </span>
              <div class="min-w-0">
                <h4 class="font-display font-extrabold text-base text-[#2D2A32] leading-snug">
                  {{ t.title }}
                </h4>
                <p class="text-sm font-semibold text-[#2D2A32]/85 mt-0.5 break-words">
                  {{ t.message }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="toastService.dismiss(t.id)"
              class="text-[#2D2A32]/60 hover:text-[#2D2A32] font-extrabold text-lg leading-none px-1.5 py-0.5 rounded-lg cursor-pointer"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          @if (t.type === 'undo') {
            <!-- Game HP Bar Countdown 10s + Undo button -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center justify-between text-xs font-extrabold">
                <span class="text-[#BE123C] flex items-center gap-1">
                  ⚡ Thanh máu thời gian còn lại:
                </span>
                <span class="money-num text-sm px-2 py-0.5 rounded-full bg-white border border-[#2D2A32]">
                  {{ (t.remainingMs / 1000).toFixed(1) }}s
                </span>
              </div>

              <!-- Game HP bar -->
              <div class="w-full h-3.5 bg-white rounded-full border-2 border-[#2D2A32] overflow-hidden p-0.5">
                <div
                  class="h-full rounded-full transition-all duration-100"
                  [style.width.%]="t.progressPercent"
                  [ngClass]="{
                    'bg-gradient-to-r from-[#22C55E] to-[#FFB020]': t.progressPercent > 45,
                    'bg-gradient-to-r from-[#FFB020] to-[#FF5C6C]': t.progressPercent <= 45
                  }"
                ></div>
              </div>

              <button
                type="button"
                [disabled]="t.undoing"
                (click)="onUndoClick(t)"
                class="toy-btn w-full py-2 px-4 bg-[#FFB020] hover:bg-[#FFA000] text-[#2D2A32] text-sm font-extrabold"
              >
                @if (t.undoing) {
                  <span>⏳ Đang quay xe...</span>
                } @else {
                  <span>↩️ {{ t.undoLabel || 'Ấy khoan! Quay xe (Undo)' }}</span>
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  onUndoClick(item: ToastItem): void {
    this.toastService.triggerUndo(item);
  }
}
