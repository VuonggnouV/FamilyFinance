import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Transaction,
  TxType,
  OwnerScope,
  OWNER_SCOPE_META,
} from '../../core/models/database.models';
import { WalletService } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
} from '../pipes/vnd.pipe';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D2A32]/60 backdrop-blur-xs overflow-y-auto"
        (click)="onClose()"
      >
        <div
          class="toy-card-lg w-full max-w-lg p-5 sm:p-6 bg-[#FFFDF5] my-auto max-h-[92dvh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
            <div class="flex items-center gap-2.5">
              <span class="text-3xl">
                @switch (type()) {
                  @case ('INCOME') { 🌾 }
                  @case ('EXPENSE') { 🛒 }
                  @case ('TRANSFER') { 🔁 }
                }
              </span>
              <div>
                <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                  {{ editTransaction ? 'Sửa ghi chép sổ tay ✏️' : 'Ghi sổ chi tiêu mới 📝' }}
                </h3>
                <p class="text-xs font-bold text-[#2D2A32]/70">
                  Mọi con số đều tự động đồng bộ cho cả 2 vợ chồng
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="toy-btn px-3 py-1 bg-white text-sm"
            >
              ✕
            </button>
          </div>

          <form (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
            <!-- Type Switcher Pills -->
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                (click)="setType('INCOME')"
                class="toy-btn py-2.5 px-2 text-xs sm:text-sm"
                [ngClass]="
                  type() === 'INCOME'
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-white text-[#2D2A32]'
                "
              >
                + Ting ting lúa về
              </button>
              <button
                type="button"
                (click)="setType('EXPENSE')"
                class="toy-btn py-2.5 px-2 text-xs sm:text-sm"
                [ngClass]="
                  type() === 'EXPENSE'
                    ? 'bg-[#FF5C6C] text-white'
                    : 'bg-white text-[#2D2A32]'
                "
              >
                - Lại chốt đơn
              </button>
              <button
                type="button"
                (click)="setType('TRANSFER')"
                class="toy-btn py-2.5 px-2 text-xs sm:text-sm"
                [ngClass]="
                  type() === 'TRANSFER'
                    ? 'bg-[#38BDF8] text-[#2D2A32]'
                    : 'bg-white text-[#2D2A32]'
                "
              >
                ⇄ Chuyển ví
              </button>
            </div>

            <!-- Amount Input with instant VND dot separator -->
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                Số tiền (VND) *
              </label>
              <div class="relative">
                <input
                  type="text"
                  inputmode="numeric"
                  name="amountDisplay"
                  [ngModel]="amountDisplay()"
                  (ngModelChange)="onAmountInput($event)"
                  placeholder="VD: 250.000"
                  required
                  class="toy-input money-num text-2xl font-extrabold pr-14 bg-white"
                  [ngClass]="{
                    'text-[#15803D]': type() === 'INCOME',
                    'text-[#BE123C]': type() === 'EXPENSE',
                    'text-[#0369A1]': type() === 'TRANSFER'
                  }"
                />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 font-display font-extrabold text-base text-[#2D2A32]/60"
                >
                  VNĐ
                </span>
              </div>
              <!-- Quick money presets -->
              <div class="flex flex-wrap gap-1.5 mt-2">
                @for (preset of quickAmounts; track preset) {
                  <button
                    type="button"
                    (click)="setQuickAmount(preset)"
                    class="px-2.5 py-1 text-xs font-extrabold rounded-xl border border-[#2D2A32] bg-white hover:bg-[#FEF3C7] cursor-pointer money-num"
                  >
                    +{{ preset | vnd: false }}
                  </button>
                }
              </div>
            </div>

            <!-- Wallet & To-Wallet (for TRANSFER) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                  {{ type() === 'TRANSFER' ? 'Từ ví xuất tiền *' : 'Nguồn tiền / Ví *' }}
                </label>
                <select
                  name="walletId"
                  [ngModel]="walletId()"
                  (ngModelChange)="onWalletChange($event)"
                  required
                  class="toy-input bg-white"
                >
                  <option value="" disabled>-- Chọn ví --</option>
                  @for (w of walletService.activeWallets(); track w.id) {
                    <option [value]="w.id">
                      {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }} ({{ w.current_balance | vnd }})
                    </option>
                  }
                </select>
              </div>

              @if (type() === 'TRANSFER') {
                <div>
                  <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                    Sang ví nhận tiền *
                  </label>
                  <select
                    name="toWalletId"
                    [ngModel]="toWalletId()"
                    (ngModelChange)="toWalletId.set($event)"
                    required
                    class="toy-input bg-white"
                  >
                    <option value="" disabled>-- Chọn ví nhận --</option>
                    @for (w of walletService.activeWallets(); track w.id) {
                      @if (w.id !== walletId()) {
                        <option [value]="w.id">
                          {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }}
                        </option>
                      }
                    }
                  </select>
                </div>
              } @else {
                <!-- Category Dropdown -->
                <div>
                  <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                    Danh mục *
                  </label>
                  <select
                    name="categoryId"
                    [ngModel]="categoryId()"
                    (ngModelChange)="onCategoryChange($event)"
                    required
                    class="toy-input bg-white"
                  >
                    <option value="" disabled>-- Chọn danh mục --</option>
                    @for (c of filteredCategories(); track c.id) {
                      <option [value]="c.id">
                        {{ c.icon || '🏷️' }} {{ c.name }}
                      </option>
                    }
                  </select>
                </div>
              }
            </div>

            <!-- Actor (Auto-suggested from Wallet owner_scope, changeable) & Date -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                  Người thực hiện (Tự gợi ý theo ví)
                </label>
                <div class="grid grid-cols-3 gap-1.5">
                  @for (scope of scopes; track scope) {
                    <button
                      type="button"
                      (click)="actor.set(scope)"
                      class="py-2 px-2 rounded-xl border-2 border-[#2D2A32] font-display font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                      [ngClass]="
                        actor() === scope
                          ? 'bg-[#FFB020] shadow-[0_2px_0_#2D2A32] -translate-y-0.5'
                          : 'bg-white opacity-75 hover:opacity-100'
                      "
                    >
                      <span>{{ ownerMeta[scope].emoji }}</span>
                      <span>{{ scope === 'WIFE' ? 'Vợ' : scope === 'HUSBAND' ? 'Chồng' : 'Chung' }}</span>
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                  Ngày giao dịch *
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  [ngModel]="transactionDate()"
                  (ngModelChange)="transactionDate.set($event)"
                  required
                  class="toy-input bg-white"
                />
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                Nội dung (Mua gì / Từ đâu?) *
              </label>
              <input
                type="text"
                name="title"
                [ngModel]="title()"
                (ngModelChange)="title.set($event)"
                placeholder="VD: Mua bỉm sữa Shopee, Lương tháng 11, Ăn lẩu Haidilao..."
                required
                class="toy-input bg-white"
              />
            </div>

            <!-- Refundable checkbox for EXPENSE -->
            @if (type() === 'EXPENSE') {
              <label
                class="flex items-center justify-between p-3 rounded-2xl border-2 border-[#2D2A32] bg-[#E0F2FE]/60 cursor-pointer select-none"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-xl">🛍️↩️</span>
                  <div>
                    <div class="font-display font-extrabold text-sm text-[#2D2A32]">
                      Có thể trả hàng / hoàn tiền?
                    </div>
                    <div class="text-xs font-semibold text-[#2D2A32]/75">
                      Bật để hiện nút "Trả hàng" khi săn sale Shopee/Lazada
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="isRefundable"
                  [ngModel]="isRefundable()"
                  (ngModelChange)="isRefundable.set($event)"
                  class="w-5 h-5 accent-[#FF8FAB] rounded cursor-pointer"
                />
              </label>
            }

            <!-- Note -->
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75 mb-1">
                Ghi chú thêm (Tùy chọn)
              </label>
              <textarea
                name="note"
                rows="2"
                [ngModel]="note()"
                (ngModelChange)="note.set($event)"
                placeholder="Ghi chú nhỏ cho nửa kia biết..."
                class="toy-input bg-white resize-none"
              ></textarea>
            </div>

            <!-- Submit Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                (click)="onClose()"
                class="toy-btn px-4 py-2.5 bg-white text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                [disabled]="submitting()"
                class="toy-btn px-6 py-2.5 text-sm text-white"
                [ngClass]="{
                  'bg-[#22C55E]': type() === 'INCOME',
                  'bg-[#FF5C6C]': type() === 'EXPENSE',
                  'bg-[#38BDF8] !text-[#2D2A32]': type() === 'TRANSFER'
                }"
              >
                @if (submitting()) {
                  <span>⏳ Đang lưu...</span>
                } @else {
                  <span>
                    {{
                      editTransaction
                        ? '💾 Lưu thay đổi'
                        : type() === 'INCOME'
                          ? '🎉 Ting ting lúa về!'
                          : type() === 'EXPENSE'
                            ? '💸 Ghi sổ chốt đơn!'
                            : '🔁 Xác nhận chuyển ví'
                    }}
                  </span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TransactionFormModalComponent implements OnChanges {
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly confetti = inject(ConfettiService);

  @Input() isOpen = false;
  @Input() defaultType: TxType = 'EXPENSE';
  @Input() editTransaction: Transaction | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly ownerMeta = OWNER_SCOPE_META;
  readonly scopes: OwnerScope[] = ['WIFE', 'HUSBAND', 'SHARED'];
  readonly quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  readonly type = signal<TxType>('EXPENSE');
  readonly amountDisplay = signal<string>('');
  readonly walletId = signal<string>('');
  readonly toWalletId = signal<string>('');
  readonly categoryId = signal<string>('');
  readonly actor = signal<OwnerScope>('SHARED');
  readonly title = signal<string>('');
  readonly note = signal<string>('');
  readonly transactionDate = signal<string>(this.todayIso());
  readonly isRefundable = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  readonly filteredCategories = computed(() => {
    const t = this.type();
    if (t === 'INCOME') return this.categoryService.incomeCategories();
    if (t === 'EXPENSE') return this.categoryService.expenseCategories();
    return [];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
    }
  }

  private initForm(): void {
    const tx = this.editTransaction;
    if (tx) {
      this.type.set(tx.type);
      this.amountDisplay.set(formatVndInput(tx.amount));
      this.walletId.set(tx.wallet_id);
      this.toWalletId.set(tx.to_wallet_id ?? '');
      this.categoryId.set(tx.category_id ?? '');
      this.actor.set(tx.actor);
      this.title.set(tx.title);
      this.note.set(tx.note ?? '');
      this.transactionDate.set(tx.transaction_date);
      this.isRefundable.set(Boolean(tx.is_refundable));
    } else {
      this.type.set(this.defaultType || 'EXPENSE');
      this.amountDisplay.set('');
      const firstWallet = this.walletService.activeWallets()[0];
      this.walletId.set(firstWallet?.id ?? '');
      this.actor.set(firstWallet?.owner_scope ?? 'SHARED');
      const secondWallet = this.walletService
        .activeWallets()
        .find((w) => w.id !== firstWallet?.id);
      this.toWalletId.set(secondWallet?.id ?? '');

      const cats = this.filteredCategories();
      const firstCat = cats[0];
      this.categoryId.set(firstCat?.id ?? '');
      this.isRefundable.set(
        this.type() === 'EXPENSE' ? Boolean(firstCat?.is_refundable) : false
      );
      this.title.set('');
      this.note.set('');
      this.transactionDate.set(this.todayIso());
    }
  }

  setType(newType: TxType): void {
    this.type.set(newType);
    const cats = this.filteredCategories();
    const firstCat = cats[0];
    this.categoryId.set(firstCat?.id ?? '');
    if (newType === 'EXPENSE') {
      this.isRefundable.set(Boolean(firstCat?.is_refundable));
    } else {
      this.isRefundable.set(false);
    }
  }

  onAmountInput(val: string): void {
    this.amountDisplay.set(formatVndInput(val));
  }

  setQuickAmount(preset: number): void {
    const current = parseVndInput(this.amountDisplay());
    this.amountDisplay.set(formatVndInput(current + preset));
  }

  onWalletChange(wId: string): void {
    this.walletId.set(wId);
    const wallet = this.walletService.getWalletById(wId);
    if (wallet) {
      // Automatically suggest actor based on wallet's owner_scope
      this.actor.set(wallet.owner_scope);
    }
    if (this.toWalletId() === wId) {
      const other = this.walletService
        .activeWallets()
        .find((w) => w.id !== wId);
      this.toWalletId.set(other?.id ?? '');
    }
  }

  onCategoryChange(cId: string): void {
    this.categoryId.set(cId);
    if (this.type() === 'EXPENSE') {
      const cat = this.categoryService.getCategoryById(cId);
      if (cat) {
        this.isRefundable.set(Boolean(cat.is_refundable));
      }
    }
  }

  async onSubmit(): Promise<void> {
    const amount = parseVndInput(this.amountDisplay());
    if (amount <= 0) {
      this.toast.show('warning', 'Khoan đã nào! 🐷', 'Số tiền phải lớn hơn 0 VNĐ nha.');
      return;
    }
    if (!this.walletId()) {
      this.toast.show('warning', 'Thiếu ví rồi! 👛', 'Vui lòng chọn ví giao dịch.');
      return;
    }
    if (this.type() === 'TRANSFER' && (!this.toWalletId() || this.toWalletId() === this.walletId())) {
      this.toast.show('warning', 'Chọn ví nhận! 🔁', 'Ví nhận phải khác ví chuyển đi.');
      return;
    }
    if (this.type() !== 'TRANSFER' && !this.categoryId()) {
      this.toast.show('warning', 'Thiếu danh mục! 🏷️', 'Vui lòng chọn danh mục thu/chi.');
      return;
    }
    if (!this.title().trim()) {
      this.toast.show('warning', 'Nhập nội dung nha! ✏️', 'Hãy ghi rõ mua gì hoặc thu từ đâu.');
      return;
    }

    this.submitting.set(true);
    try {
      if (this.editTransaction) {
        await this.transactionService.updateTransaction(this.editTransaction.id, {
          type: this.type(),
          amount,
          wallet_id: this.walletId(),
          to_wallet_id: this.type() === 'TRANSFER' ? this.toWalletId() : null,
          category_id: this.type() === 'TRANSFER' ? null : this.categoryId(),
          actor: this.actor(),
          title: this.title(),
          note: this.note() || null,
          transaction_date: this.transactionDate(),
          is_refundable: this.type() === 'EXPENSE' ? this.isRefundable() : false,
        });
        this.toast.show('success', 'Đã cập nhật! ✨', 'Sổ chi tiêu đã được sửa gọn gàng.');
      } else {
        await this.transactionService.createTransaction({
          type: this.type(),
          amount,
          wallet_id: this.walletId(),
          to_wallet_id: this.type() === 'TRANSFER' ? this.toWalletId() : null,
          category_id: this.type() === 'TRANSFER' ? null : this.categoryId(),
          actor: this.actor(),
          title: this.title(),
          note: this.note() || null,
          transaction_date: this.transactionDate(),
          is_refundable: this.type() === 'EXPENSE' ? this.isRefundable() : false,
        });

        if (this.type() === 'INCOME') {
          this.confetti.celebrate();
          this.toast.show(
            'success',
            'Ting ting lúa về! 🌾🎉',
            `Đã cộng thêm ${formatVndInput(amount)} ₫ vào két sắt gia đình!`
          );
        } else if (this.type() === 'EXPENSE') {
          this.toast.show(
            'info',
            'Đã ghi sổ chốt đơn! 🛒',
            `Đã ghi khoản chi ${formatVndInput(amount)} ₫.`
          );
        } else {
          this.toast.show('success', 'Chuyển ví xong! 🔁', 'Số dư các ví đã được cập nhật.');
        }
      }

      this.saved.emit();
      this.onClose();
    } catch (err: any) {
      this.toast.show(
        'error',
        'Ối, có lỗi xảy ra! 🚨',
        err?.message || 'Không thể lưu giao dịch.'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  private todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }
}
