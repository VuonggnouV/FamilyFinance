import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Transaction,
  OWNER_SCOPE_META,
} from '../../core/models/database.models';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
  appendThreeZeros,
} from '../pipes/vnd.pipe';

@Component({
  selector: 'app-refund-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    @if (isOpen && transaction) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A32]/60 backdrop-blur-xs"
        (click)="onClose()"
      >
        <div
          class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] space-y-5"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 border-b-2 border-dashed border-[#2D2A32]/20 pb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-[#E0F2FE] border-2 border-[#2D2A32] flex items-center justify-center text-2xl shadow-[0_3px_0_#2D2A32]"
              >
                🛒↩️
              </div>
              <div>
                <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                  Quay xe trả hàng nè! 🛒↩️
                </h3>
                <p class="text-xs font-bold text-[#2D2A32]/70">
                  Tiền hoàn sẽ trừ khỏi Chi thực tế (không cộng nhầm vào Thu)
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="toy-btn px-2.5 py-1 bg-white text-sm"
            >
              ✕
            </button>
          </div>

          <!-- Original Transaction Summary Sticker -->
          <div class="p-3.5 rounded-2xl bg-[#FFE4E6]/60 border-2 border-[#2D2A32] flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-[#2D2A32]/70">Đơn hàng gốc:</div>
              <div class="font-display font-extrabold text-base text-[#2D2A32]">
                {{ transaction.title }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-[#2D2A32]/70">Số tiền đã chi:</div>
              <div class="money-num font-extrabold text-lg text-[#BE123C]">
                {{ transaction.amount | vnd }}
              </div>
            </div>
          </div>

          <!-- COMPONENT 1: Khung nhập số tiền hoàn + Nút .000 + Dropdown chọn ví nhận hoàn tiền -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                1. Số tiền được hoàn lại (VND) *
              </label>
              <div class="relative">
                <input
                  type="text"
                  inputmode="numeric"
                  [ngModel]="refundAmountDisplay()"
                  (ngModelChange)="onAmountChange($event)"
                  placeholder="0"
                  class="toy-input money-num text-2xl font-extrabold text-[#15803D] bg-white pr-14"
                />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 font-display font-extrabold text-sm text-[#2D2A32]/60"
                >
                  VNĐ
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <button
                  type="button"
                  (click)="onAppendThreeZeros()"
                  class="px-3 py-1 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FFB020] hover:bg-[#FFA000] text-[#2D2A32] shadow-[0_2px_0_#2D2A32] cursor-pointer money-num"
                >
                  .000 (×1000)
                </button>
                <button
                  type="button"
                  (click)="onAmountChange(String(transaction.amount))"
                  class="px-2.5 py-1 text-xs font-extrabold rounded-xl border border-[#2D2A32] bg-white hover:bg-[#DCFCE7] cursor-pointer money-num"
                >
                  Đặt bằng tiền gốc ({{ transaction.amount | vnd }})
                </button>
              </div>

              @if (validationError()) {
                <p class="text-xs font-extrabold text-[#BE123C] mt-1">
                  🚨 {{ validationError() }}
                </p>
              } @else {
                <p class="text-xs font-semibold text-[#2D2A32]/70 mt-1">
                  Tối đa: <span class="money-num font-bold">{{ transaction.amount | vnd }}</span>
                </p>
              }
            </div>

            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                Ví nhận tiền hoàn về (Mặc định là ví gốc)
              </label>
              <select
                [ngModel]="refundWalletId()"
                (ngModelChange)="refundWalletId.set($event)"
                class="toy-input bg-white"
              >
                @for (w of walletService.activeWallets(); track w.id) {
                  <option [value]="w.id">
                    {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }} ({{ w.current_balance | vnd }})
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- COMPONENT 2 & COMPONENT 3: Nút "Xác nhận" & Nút "Hoàn toàn bộ 100%" -->
          @if (refundDone()) {
            <button
              type="button"
              (click)="onClose()"
              class="toy-btn w-full py-3 bg-[#22C55E] text-white text-base font-extrabold"
            >
              ✅ Đã hoàn tiền xong! (Đóng)
            </button>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                [disabled]="submitting()"
                (click)="confirmPartialOrCustomRefund()"
                class="toy-btn py-3 px-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#2D2A32] text-sm font-extrabold"
              >
                ✅ Xác nhận hoàn
              </button>

              <button
                type="button"
                [disabled]="submitting()"
                (click)="confirmFullRefund()"
                class="toy-btn py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-extrabold"
              >
                💯 Hoàn toàn bộ 100%
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class RefundModalComponent implements OnChanges {
  readonly walletService = inject(WalletService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly confetti = inject(ConfettiService);

  readonly String = String;

  @Input() isOpen = false;
  @Input() transaction: Transaction | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() refunded = new EventEmitter<void>();

  readonly ownerMeta = OWNER_SCOPE_META;
  readonly refundAmountDisplay = signal<string>('');
  readonly refundWalletId = signal<string>('');
  readonly validationError = signal<string>('');
  readonly submitting = signal<boolean>(false);
  readonly refundDone = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['transaction']) && this.isOpen && this.transaction) {
      this.submitting.set(false);
      this.refundDone.set(false);
      this.refundAmountDisplay.set(formatVndInput(this.transaction.amount));
      this.refundWalletId.set(this.transaction.wallet_id);
      this.validationError.set('');
    }
  }

  onAppendThreeZeros(): void {
    const next = appendThreeZeros(this.refundAmountDisplay());
    if (next) {
      this.onAmountChange(next);
    }
  }

  onAmountChange(val: string): void {
    const formatted = formatVndInput(val);
    this.refundAmountDisplay.set(formatted);
    const num = parseVndInput(formatted);
    const max = this.transaction?.amount ?? 0;

    if (num <= 0) {
      this.validationError.set('Số tiền hoàn phải lớn hơn 0 VNĐ');
    } else if (num > max) {
      this.validationError.set('Số tiền hoàn không được vượt quá số tiền gốc đã mua');
    } else {
      this.validationError.set('');
    }
  }

  async confirmPartialOrCustomRefund(): Promise<void> {
    if (!this.transaction || this.submitting() || this.refundDone()) return;
    const amount = parseVndInput(this.refundAmountDisplay());
    if (amount <= 0 || amount > this.transaction.amount) {
      this.validationError.set(
        `Vui lòng nhập số tiền từ 1 ₫ đến ${formatVndInput(this.transaction.amount)} ₫`
      );
      return;
    }
    await this.executeRefund(amount);
  }

  async confirmFullRefund(): Promise<void> {
    if (!this.transaction || this.submitting() || this.refundDone()) return;
    await this.executeRefund(null);
  }

  private async executeRefund(p_refund_amount: number | null): Promise<void> {
    if (!this.transaction || this.submitting() || this.refundDone()) return;
    const tx = this.transaction;
    const walletId = this.refundWalletId() || tx.wallet_id;

    this.submitting.set(true);
    try {
      await this.transactionService.refundTransaction({
        p_tx_id: tx.id,
        p_refund_amount,
        p_refund_wallet_id: walletId,
      });

      const actualRefund = p_refund_amount ?? tx.amount;
      this.refundDone.set(true);
      this.confetti.celebrate();
      this.refunded.emit();
      this.onClose();

      this.toast.showUndo(
        'Đã hoàn tiền trả hàng! 🛒↩️',
        `Đã hoàn ${formatVndInput(actualRefund)} ₫ cho đơn "${tx.title}". Bạn có 10 giây nếu bấm nhầm!`,
        async () => {
          await this.transactionService.undoRefundTransaction(tx.id);
          this.toast.show(
            'info',
            'Đã quay xe thành công! 🏎️💨',
            `Đơn "${tx.title}" đã trở về trạng thái Done ✓ như cũ.`
          );
        }
      );
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không thể hoàn tiền! 🚨',
        err?.message || 'Vui lòng kiểm tra lại kết nối.'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  onClose(): void {
    this.closed.emit();
  }
}
