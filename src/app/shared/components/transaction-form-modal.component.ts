import {
  Component,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
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
  CategoryType,
  OWNER_SCOPE_META,
} from '../../core/models/database.models';
import { WalletService } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
  getMoneySuggestions,
} from '../pipes/vnd.pipe';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    @if (isOpen && !forceClosed()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D2A32]/60 backdrop-blur-xs overflow-y-auto"
        (click)="onClose()"
      >
        <div
          class="toy-card-lg w-full max-w-lg p-5 sm:p-6 bg-[#FFFDF5] my-auto max-h-[92dvh] overflow-y-auto relative"
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
            <!-- Smart Voice Quick Mode Banner (Kiểu 2 - Khi nhấn giữ 1s nút + / - Chi) -->
            @if (voiceMode() === 'SMART' || smartVoiceBannerVisible()) {
              <div
                class="p-3.5 rounded-2xl border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] flex items-center justify-between gap-3 transition-all"
                [ngClass]="
                  voiceInput.isListening() && voiceMode() === 'SMART'
                    ? 'bg-[#FFE4E6] animate-pulse'
                    : 'bg-[#FFF9EC]'
                "
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="w-10 h-10 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-center text-xl shrink-0"
                    [ngClass]="
                      voiceInput.isListening() && voiceMode() === 'SMART'
                        ? 'bg-[#FF5C6C] text-white'
                        : 'bg-[#FFB020] text-[#2D2A32]'
                    "
                  >
                    🎙️
                  </span>
                  <div class="min-w-0">
                    <div class="font-display font-extrabold text-xs sm:text-sm text-[#2D2A32]">
                      {{
                        voiceInput.isListening() && voiceMode() === 'SMART'
                          ? '🎙️ Đang nghe nhập Chi nhanh...'
                          : '✨ Đã tách giọng nói thông minh!'
                      }}
                    </div>
                    <div class="text-[11px] font-bold text-[#2D2A32]/75 truncate">
                      {{
                        smartVoiceRawText()
                          ? '“' + smartVoiceRawText() + '”'
                          : 'Nói tên món + số tiền (VD: "Ăn trưa 45 nghìn", "Bỉm sữa 250k")'
                      }}
                    </div>
                  </div>
                </div>

                @if (voiceInput.isListening() && voiceMode() === 'SMART') {
                  <button
                    type="button"
                    (click)="stopVoiceCapture()"
                    class="toy-btn px-3 py-1.5 bg-[#FF5C6C] text-white text-xs font-extrabold shrink-0"
                  >
                    ⏹ Xong
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="startSmartVoiceCapture()"
                    class="toy-btn px-3 py-1.5 bg-white text-[#2D2A32] text-xs font-extrabold shrink-0"
                  >
                    🎙️ Nói lại
                  </button>
                }
              </div>
            }

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

            <!-- Amount Input with right-side Clear button + 3 live dynamic suggestions -->
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
                  placeholder="0"
                  required
                  class="toy-input money-num text-2xl font-extrabold pr-24 bg-white"
                  [ngClass]="{
                    'text-[#15803D]': type() === 'INCOME',
                    'text-[#BE123C]': type() === 'EXPENSE',
                    'text-[#0369A1]': type() === 'TRANSFER'
                  }"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  @if (amountDisplay()) {
                    <button
                      type="button"
                      (mousedown)="$event.preventDefault()"
                      (click)="clearAmount()"
                      class="px-2.5 py-1 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FFE4E6] hover:bg-[#FF5C6C] text-[#BE123C] hover:text-white shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer transition-colors"
                      title="Xóa số tiền vừa nhập"
                    >
                      ✕ Xóa
                    </button>
                  } @else {
                    <span class="font-display font-extrabold text-base text-[#2D2A32]/60">
                      VNĐ
                    </span>
                  }
                </div>
              </div>

              <!-- 3 Live Money Suggestions while typing (e.g. 3 -> 3.000 | 30.000 | 300.000) -->
              @if (moneySuggestions().length > 0) {
                <div class="grid grid-cols-3 gap-2 mt-2">
                  @for (sug of moneySuggestions(); track sug.raw) {
                    <button
                      type="button"
                      (mousedown)="$event.preventDefault()"
                      (click)="applyMoneySuggestion(sug.display)"
                      class="py-1.5 px-2 text-xs sm:text-sm font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FEF3C7] hover:bg-[#FFB020] active:bg-[#FFB020] text-[#2D2A32] shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer money-num text-center truncate transition-colors"
                    >
                      {{ sug.display }} ₫
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Wallet & Category / To-Wallet -->
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
                <!-- Category Dropdown with inline "➕ Thêm danh mục mới..." -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75">
                      Danh mục *
                    </label>
                    <button
                      type="button"
                      (click)="openQuickCategoryModal()"
                      class="text-[11px] font-display font-extrabold text-[#0369A1] hover:underline cursor-pointer"
                    >
                      ➕ Thêm danh mục
                    </button>
                  </div>
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
                    <option value="__ADD_NEW__" class="font-extrabold text-[#0369A1]">
                      ➕ Thêm danh mục mới...
                    </option>
                  </select>
                </div>
              }
            </div>

            <!-- Date & Context-Aware Optional Title (Hidden on TRANSFER!) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              @if (type() !== 'TRANSFER') {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/75">
                      {{
                        type() === 'INCOME'
                          ? 'Từ đâu? (Tùy chọn)'
                          : 'Mua gì? (Tùy chọn)'
                      }}
                    </label>
                    @if (voiceInput.isListening() && voiceMode() === 'TITLE') {
                      <span class="text-[11px] font-extrabold text-[#BE123C] animate-pulse">
                        🎙️ Đang nghe... thả tay để dừng
                      </span>
                    } @else {
                      <span class="text-[10px] font-bold text-[#2D2A32]/55">
                        Giữ 🎙️ để nói
                      </span>
                    }
                  </div>

                  <div class="relative">
                    <input
                      type="text"
                      name="title"
                      [ngModel]="title()"
                      (ngModelChange)="title.set($event)"
                      [placeholder]="
                        type() === 'INCOME'
                          ? 'VD: Lương tháng, Thưởng... (Giữ 🎙️ để nói)'
                          : 'VD: Bỉm sữa Shopee, Ăn trưa... (Giữ 🎙️ để nói)'
                      "
                      class="toy-input bg-white pr-13"
                    />

                    <!-- Push-to-talk / Tap-to-talk Microphone Button (Kiểu 1) -->
                    <button
                      type="button"
                      (pointerdown)="onTitleMicPointerDown($event)"
                      (pointerup)="onTitleMicPointerUp($event)"
                      (pointercancel)="onTitleMicPointerCancel()"
                      (contextmenu)="$event.preventDefault()"
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl border-2 border-[#2D2A32] flex items-center justify-center text-base cursor-pointer select-none touch-none transition-all"
                      [ngClass]="
                        voiceInput.isListening() && voiceMode() === 'TITLE'
                          ? 'bg-[#FF5C6C] text-white scale-110 shadow-none animate-pulse'
                          : 'bg-[#FFF9EC] hover:bg-[#FFB020] text-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                      "
                      title="Nhấn giữ để nói nội dung (hoặc chạm để bật/tắt mic)"
                    >
                      🎙️
                    </button>
                  </div>
                </div>
              }
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

            <!-- Submit Buttons (Transforms to single Done button after save to prevent duplicates) -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              @if (savedDone()) {
                <button
                  type="button"
                  (click)="onClose()"
                  class="toy-btn w-full py-3 bg-[#22C55E] text-white text-base font-extrabold"
                >
                  ✅ Đã lưu xong! (Đóng)
                </button>
              } @else {
                <button
                  type="button"
                  [disabled]="submitting()"
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
              }
            </div>
          </form>

          <!-- INLINE POPUP MINI: Thêm danh mục mới ngay trong lúc giao dịch -->
          @if (quickCatModalOpen()) {
            <div
              class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2A32]/65 backdrop-blur-xs"
              (click)="closeQuickCategoryModal()"
            >
              <div
                class="toy-card-lg w-full max-w-md p-5 bg-[#FFFDF5] space-y-4"
                (click)="$event.stopPropagation()"
              >
                <div class="flex items-center justify-between pb-2.5 border-b-2 border-dashed border-[#2D2A32]/20">
                  <h4 class="font-display font-extrabold text-lg text-[#2D2A32]">
                    🏷️ Thêm danh mục {{ type() === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi' }} mới
                  </h4>
                  <button
                    type="button"
                    (click)="closeQuickCategoryModal()"
                    class="toy-btn px-2.5 py-1 bg-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                      Tên danh mục *
                    </label>
                    <input
                      type="text"
                      [ngModel]="newCatName()"
                      (ngModelChange)="onNewCategoryNameChange($event)"
                      placeholder="VD: Mua sắm Shopee, Trà sữa, Tiền thưởng..."
                      class="toy-input bg-white"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-2.5">
                    <div>
                      <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                        Icon Sticker
                      </label>
                      <div class="flex flex-wrap gap-1 p-2 rounded-xl border-2 border-[#2D2A32] bg-white max-h-28 overflow-y-auto">
                        @for (ic of emojiChoices; track ic) {
                          <button
                            type="button"
                            (click)="newCatIcon.set(ic)"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-pointer"
                            [ngClass]="newCatIcon() === ic ? 'bg-[#FFB020] border border-[#2D2A32]' : 'hover:bg-[#FFF9EC]'"
                          >
                            {{ ic }}
                          </button>
                        }
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                        Màu sắc
                      </label>
                      <div class="flex flex-wrap gap-1.5 p-2 rounded-xl border-2 border-[#2D2A32] bg-white">
                        @for (clr of colorChoices; track clr) {
                          <button
                            type="button"
                            (click)="newCatColor.set(clr)"
                            class="w-7 h-7 rounded-full border-2 border-[#2D2A32] cursor-pointer"
                            [style.backgroundColor]="clr"
                            [class.scale-110]="newCatColor() === clr"
                          ></button>
                        }
                      </div>
                    </div>
                  </div>

                  @if (type() === 'EXPENSE') {
                    <label
                      class="flex items-center justify-between p-2.5 rounded-2xl border-2 border-[#2D2A32] bg-[#E0F2FE]/60 cursor-pointer select-none"
                    >
                      <span class="font-display font-extrabold text-xs text-[#2D2A32]">
                        ↩️ Cho phép Trả hàng / Hoàn tiền?
                      </span>
                      <input
                        type="checkbox"
                        [ngModel]="newCatRefundable()"
                        (ngModelChange)="newCatRefundable.set($event)"
                        class="w-5 h-5 accent-[#FF8FAB] rounded cursor-pointer"
                      />
                    </label>
                  }

                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      (click)="closeQuickCategoryModal()"
                      class="toy-btn px-3.5 py-2 bg-white text-xs"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      [disabled]="savingQuickCat()"
                      (click)="onSaveQuickCategory()"
                      class="toy-btn px-4 py-2 bg-[#FF8FAB] text-[#2D2A32] text-xs font-extrabold"
                    >
                      {{ savingQuickCat() ? '⏳ Đang tạo...' : '✨ Tạo & Chọn luôn' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class TransactionFormModalComponent implements OnChanges, OnDestroy {
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  readonly voiceInput = inject(VoiceInputService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly confetti = inject(ConfettiService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Input() defaultType: TxType = 'EXPENSE';
  @Input() editTransaction: Transaction | null = null;
  @Input() voicePrefill: {
    title: string;
    amount: number | null;
    rawText: string;
  } | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly ownerMeta = OWNER_SCOPE_META;

  readonly emojiChoices = [
    '🛍️',
    '🍜',
    '🍼',
    '🏠',
    '🚗',
    '💊',
    '🎉',
    '🌾',
    '💰',
    '🎁',
    '📚',
    '✈️',
    '🧋',
    '🐶',
    '🐱',
  ];

  readonly colorChoices = [
    '#FF8FAB',
    '#FFB020',
    '#38BDF8',
    '#22C55E',
    '#9B6BFF',
    '#FF5C6C',
    '#FDE68A',
    '#A7F3D0',
  ];

  readonly type = signal<TxType>('EXPENSE');
  readonly amountDisplay = signal<string>('');
  readonly showAmountSuggestions = signal<boolean>(true);
  readonly walletId = signal<string>('');
  readonly toWalletId = signal<string>('');
  readonly categoryId = signal<string>('');
  readonly title = signal<string>('');
  readonly note = signal<string>('');
  readonly transactionDate = signal<string>(this.todayIso());
  readonly isRefundable = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly savedDone = signal<boolean>(false);
  readonly forceClosed = signal<boolean>(false);

  // Voice Input State ('NONE' | 'TITLE' (Kiểu 1) | 'SMART' (Kiểu 2))
  readonly voiceMode = signal<'NONE' | 'TITLE' | 'SMART'>('NONE');
  readonly smartVoiceBannerVisible = signal<boolean>(false);
  readonly smartVoiceRawText = signal<string>('');
  private titleMicPressStart = 0;

  // Quick Inline Category Creation Modal State
  readonly quickCatModalOpen = signal<boolean>(false);
  readonly newCatName = signal<string>('');
  readonly newCatIcon = signal<string>('🛍️');
  readonly newCatColor = signal<string>('#FF8FAB');
  readonly newCatRefundable = signal<boolean>(false);
  readonly savingQuickCat = signal<boolean>(false);

  readonly filteredCategories = computed(() => {
    const t = this.type();
    if (t === 'INCOME') return this.categoryService.incomeCategories();
    if (t === 'EXPENSE') return this.categoryService.expenseCategories();
    return [];
  });

  readonly moneySuggestions = computed(() => {
    if (!this.showAmountSuggestions()) return [];
    return getMoneySuggestions(this.amountDisplay());
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.initForm();
      } else {
        this.stopVoiceCaptureImmediate();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopVoiceCaptureImmediate();
  }

  private initForm(): void {
    this.submitting.set(false);
    this.savedDone.set(false);
    this.forceClosed.set(false);
    this.quickCatModalOpen.set(false);
    this.showAmountSuggestions.set(true);
    this.voiceMode.set('NONE');
    this.smartVoiceBannerVisible.set(false);
    this.smartVoiceRawText.set('');

    const tx = this.editTransaction;
    if (tx) {
      this.type.set(tx.type);
      this.amountDisplay.set(formatVndInput(tx.amount));
      this.showAmountSuggestions.set(false);
      this.walletId.set(tx.wallet_id);
      this.toWalletId.set(tx.to_wallet_id ?? '');
      this.categoryId.set(tx.category_id ?? '');
      this.title.set(tx.title);
      this.note.set(tx.note ?? '');
      this.transactionDate.set(tx.transaction_date);
      this.isRefundable.set(Boolean(tx.is_refundable));
    } else {
      this.type.set(this.defaultType || 'EXPENSE');
      this.amountDisplay.set('');
      const firstWallet = this.walletService.activeWallets()[0];
      this.walletId.set(firstWallet?.id ?? '');
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

      if (this.voicePrefill) {
        if (this.voicePrefill.rawText) {
          this.smartVoiceBannerVisible.set(true);
          this.smartVoiceRawText.set(this.voicePrefill.rawText);
        }
        if (this.voicePrefill.title) {
          this.title.set(this.voicePrefill.title);
          this.autoMatchCategoryFromText(this.voicePrefill.title);
        }
        if (this.voicePrefill.amount && this.voicePrefill.amount > 0) {
          this.amountDisplay.set(formatVndInput(this.voicePrefill.amount));
          this.showAmountSuggestions.set(false);
        }
      }
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
    this.showAmountSuggestions.set(true);
    this.amountDisplay.set(formatVndInput(val));
  }

  applyMoneySuggestion(formattedDisplay: string): void {
    this.amountDisplay.set(formattedDisplay);
    this.showAmountSuggestions.set(false);
  }

  clearAmount(): void {
    this.amountDisplay.set('');
    this.showAmountSuggestions.set(true);
  }

  // =========================================================================
  // KIỂU 1: Nhấn giữ icon Micro 🎙️ ở ô "Từ đâu? / Mua gì?" (Chỉ nhập chữ vào ô)
  // =========================================================================
  onTitleMicPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // If already listening in TITLE mode, tapping again stops it
    if (this.voiceInput.isListening() && this.voiceMode() === 'TITLE') {
      this.titleMicPressStart = 0;
      this.stopVoiceCapture();
      return;
    }

    this.titleMicPressStart = Date.now();
    this.voiceMode.set('TITLE');
    const started = this.voiceInput.startListening({
      onTranscript: (text) => {
        this.title.set(this.voiceInput.formatTitle(text));
        this.cdr.detectChanges();
      },
      onEnd: () => {
        if (this.voiceMode() === 'TITLE') {
          this.voiceMode.set('NONE');
        }
        this.cdr.detectChanges();
      },
      onError: (msg) => {
        this.voiceMode.set('NONE');
        this.toast.show('warning', 'Micro thông báo 🎙️', msg);
        this.cdr.detectChanges();
      },
    });

    if (!started) {
      this.voiceMode.set('NONE');
    }
  }

  onTitleMicPointerUp(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.titleMicPressStart) return;
    const heldMs = Date.now() - this.titleMicPressStart;
    this.titleMicPressStart = 0;

    // If user held >= 300ms (Hold-to-talk), stop listening on release
    if (heldMs >= 300 && this.voiceInput.isListening()) {
      this.stopVoiceCapture(280);
    }
  }

  onTitleMicPointerCancel(): void {
    if (this.titleMicPressStart && this.voiceInput.isListening()) {
      this.titleMicPressStart = 0;
      this.stopVoiceCapture(280);
    }
  }

  // =========================================================================
  // KIỂU 2: Nhấn giữ 1 giây ở nút + / - Chi -> Tách cả Nội dung + Số tiền + Danh mục
  // =========================================================================
  startSmartVoiceCapture(): void {
    this.voiceMode.set('SMART');
    this.smartVoiceBannerVisible.set(true);
    this.smartVoiceRawText.set('');

    const started = this.voiceInput.startListening({
      onTranscript: (text) => {
        this.smartVoiceRawText.set(text);
        const parsed = this.voiceInput.parseSmartVoiceTransaction(text);
        if (parsed.title) {
          this.title.set(parsed.title);
          this.autoMatchCategoryFromText(parsed.title);
        }
        if (parsed.amount && parsed.amount > 0) {
          this.amountDisplay.set(formatVndInput(parsed.amount));
          this.showAmountSuggestions.set(false);
        }
        this.cdr.detectChanges();
      },
      onEnd: () => {
        if (this.voiceMode() === 'SMART') {
          this.voiceMode.set('NONE');
        }
        this.cdr.detectChanges();
      },
      onError: (msg) => {
        this.voiceMode.set('NONE');
        this.toast.show('warning', 'Micro thông báo 🎙️', msg);
        this.cdr.detectChanges();
      },
    });

    if (!started) {
      this.voiceMode.set('NONE');
    }
  }

  stopVoiceCapture(graceMs = 250): void {
    this.voiceInput.stopListening(graceMs);
  }

  private stopVoiceCaptureImmediate(): void {
    this.voiceInput.stopListeningImmediate();
    this.voiceMode.set('NONE');
  }

  private autoMatchCategoryFromText(spokenTitle: string): void {
    const lower = spokenTitle.toLowerCase();
    const cats = this.filteredCategories();
    if (!cats.length) return;

    // 1. Direct name match
    const direct = cats.find((c) => lower.includes(c.name.toLowerCase()));
    if (direct) {
      this.onCategoryChange(direct.id);
      return;
    }

    // 2. Smart keyword dictionary for Vietnamese daily transactions
    const keywordGroups: { keywords: string[]; catHints: string[] }[] = [
      {
        keywords: [
          'ăn',
          'uống',
          'cơm',
          'phở',
          'bún',
          'mì',
          'cháo',
          'cà phê',
          'cafe',
          'trà sữa',
          'nhậu',
          'bữa sáng',
          'bữa trưa',
          'bữa tối',
          'siêu thị',
          'đi chợ',
          'rau',
          'thịt',
          'cá',
        ],
        catHints: ['ăn uống', 'ăn', 'thực phẩm', 'đi chợ'],
      },
      {
        keywords: [
          'mua',
          'shopee',
          'lazada',
          'tiktok',
          'tiki',
          'áo',
          'quần',
          'giày',
          'váy',
          'mỹ phẩm',
          'son',
          'săn sale',
        ],
        catHints: ['mua sắm', 'shopping', 'quần áo'],
      },
      {
        keywords: ['bỉm', 'sữa', 'tã', 'con', 'em bé', 'học phí', 'đồ chơi'],
        catHints: ['con cái', 'em bé', 'bỉm sữa'],
      },
      {
        keywords: [
          'điện',
          'nước',
          'wifi',
          'mạng',
          'xăng',
          'gửi xe',
          'grab',
          'taxi',
          'nhà',
          'thuốc',
          'khám',
        ],
        catHints: ['sinh hoạt', 'hóa đơn', 'đi lại', 'nhà cửa', 'y tế'],
      },
      {
        keywords: ['lương', 'thưởng', 'lãi', 'cổ tức', 'hoa hồng'],
        catHints: ['lương', 'thưởng', 'thu nhập'],
      },
    ];

    for (const group of keywordGroups) {
      if (group.keywords.some((kw) => lower.includes(kw))) {
        const matchedCat = cats.find((c) =>
          group.catHints.some((hint) => c.name.toLowerCase().includes(hint))
        );
        if (matchedCat) {
          this.onCategoryChange(matchedCat.id);
          return;
        }
      }
    }
  }

  onWalletChange(wId: string): void {
    this.walletId.set(wId);
    if (this.toWalletId() === wId) {
      const other = this.walletService
        .activeWallets()
        .find((w) => w.id !== wId);
      this.toWalletId.set(other?.id ?? '');
    }
  }

  onCategoryChange(cId: string): void {
    if (cId === '__ADD_NEW__') {
      // Revert select value temporarily and open quick category modal
      const firstCat = this.filteredCategories()[0];
      this.categoryId.set(firstCat?.id ?? '');
      this.openQuickCategoryModal();
      return;
    }
    this.categoryId.set(cId);
    if (this.type() === 'EXPENSE') {
      const cat = this.categoryService.getCategoryById(cId);
      if (cat) {
        this.isRefundable.set(Boolean(cat.is_refundable));
      }
    }
  }

  openQuickCategoryModal(): void {
    this.newCatName.set('');
    this.newCatIcon.set(this.type() === 'INCOME' ? '🌾' : '🛍️');
    this.newCatColor.set(this.type() === 'INCOME' ? '#22C55E' : '#FF8FAB');
    this.newCatRefundable.set(false);
    this.quickCatModalOpen.set(true);
  }

  closeQuickCategoryModal(): void {
    this.quickCatModalOpen.set(false);
  }

  onNewCategoryNameChange(val: string): void {
    this.newCatName.set(val);
    if (this.type() === 'EXPENSE' && val.toLowerCase().includes('mua sắm')) {
      this.newCatRefundable.set(true);
    }
  }

  async onSaveQuickCategory(): Promise<void> {
    if (this.savingQuickCat()) return;
    if (!this.newCatName().trim()) {
      this.toast.show('warning', 'Thiếu tên danh mục! 🏷️', 'Hãy nhập tên danh mục mới.');
      return;
    }

    const catType: CategoryType =
      this.type() === 'INCOME' ? 'INCOME' : 'EXPENSE';

    this.savingQuickCat.set(true);
    try {
      const created = await this.categoryService.createCategory({
        name: this.newCatName(),
        type: catType,
        icon: this.newCatIcon(),
        color: this.newCatColor(),
        is_refundable: catType === 'EXPENSE' ? this.newCatRefundable() : false,
      });
      this.categoryId.set(created.id);
      if (catType === 'EXPENSE') {
        this.isRefundable.set(Boolean(created.is_refundable));
      }
      this.quickCatModalOpen.set(false);
      this.cdr.detectChanges();
      this.toast.show(
        'success',
        'Đã tạo & chọn danh mục mới! 🏷️✨',
        `Danh mục "${created.name}" đã được chọn sẵn cho giao dịch này.`
      );
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không thể tạo danh mục! 🚨',
        err?.message || 'Vui lòng thử lại.'
      );
    } finally {
      this.savingQuickCat.set(false);
      this.cdr.detectChanges();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.savedDone()) return;
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur?.();
    }

    const amount = parseVndInput(this.amountDisplay());
    if (amount <= 0) {
      this.toast.show('warning', 'Khoan đã nào! 🐷', 'Số tiền phải lớn hơn 0 VNĐ nha.');
      return;
    }
    if (!this.walletId()) {
      this.toast.show('warning', 'Thiếu ví rồi! 👛', 'Vui lòng chọn ví giao dịch.');
      return;
    }
    if (
      this.type() === 'TRANSFER' &&
      (!this.toWalletId() || this.toWalletId() === this.walletId())
    ) {
      this.toast.show('warning', 'Chọn ví nhận! 🔁', 'Ví nhận phải khác ví chuyển đi.');
      return;
    }
    if (this.type() !== 'TRANSFER' && !this.categoryId()) {
      this.toast.show('warning', 'Thiếu danh mục! 🏷️', 'Vui lòng chọn danh mục thu/chi.');
      return;
    }

    // Automatically derive actor from selected wallet's owner_scope
    const selectedWallet = this.walletService.getWalletById(this.walletId());
    const derivedActor = selectedWallet?.owner_scope ?? 'SHARED';

    // Context-aware optional title fallback
    const selectedCat = this.categoryService.getCategoryById(this.categoryId());
    let finalTitle = this.title().trim();
    if (this.type() === 'TRANSFER') {
      const toW = this.walletService.getWalletById(this.toWalletId());
      finalTitle = `Chuyển ví: ${selectedWallet?.name || 'Ví'} ➔ ${toW?.name || 'Ví nhận'}`;
    } else if (!finalTitle) {
      finalTitle =
        selectedCat?.name ||
        (this.type() === 'INCOME' ? 'Khoản thu' : 'Khoản chi');
    }

    this.submitting.set(true);
    try {
      const currentType = this.type();
      const isEditing = Boolean(this.editTransaction);

      if (this.editTransaction) {
        await this.transactionService.updateTransaction(this.editTransaction.id, {
          type: currentType,
          amount,
          wallet_id: this.walletId(),
          to_wallet_id: currentType === 'TRANSFER' ? this.toWalletId() : null,
          category_id: currentType === 'TRANSFER' ? null : this.categoryId(),
          actor: derivedActor,
          title: finalTitle,
          note: this.note() || null,
          transaction_date: this.transactionDate(),
          is_refundable: currentType === 'EXPENSE' ? this.isRefundable() : false,
        });
      } else {
        await this.transactionService.createTransaction({
          type: currentType,
          amount,
          wallet_id: this.walletId(),
          to_wallet_id: currentType === 'TRANSFER' ? this.toWalletId() : null,
          category_id: currentType === 'TRANSFER' ? null : this.categoryId(),
          actor: derivedActor,
          title: finalTitle,
          note: this.note() || null,
          transaction_date: this.transactionDate(),
          is_refundable: currentType === 'EXPENSE' ? this.isRefundable() : false,
        });
      }

      // Close modal FIRST immediately after DB success so it always exits on mobile
      this.savedDone.set(true);
      this.forceClosed.set(true);
      this.saved.emit();
      this.onClose();
      this.cdr.detectChanges();

      if (isEditing) {
        this.toast.show('success', 'Đã cập nhật! ✨', 'Sổ chi tiêu đã được sửa gọn gàng.');
      } else if (currentType === 'INCOME') {
        this.confetti.celebrate();
        this.toast.show(
          'success',
          'Ting ting lúa về! 🌾🎉',
          `Đã cộng thêm ${formatVndInput(amount)} ₫ vào két sắt gia đình!`
        );
      } else if (currentType === 'EXPENSE') {
        this.toast.show(
          'info',
          'Đã ghi sổ chốt đơn! 🛒',
          `Đã ghi khoản chi "${finalTitle}" (${formatVndInput(amount)} ₫).`
        );
      } else {
        this.toast.show('success', 'Chuyển ví xong! 🔁', 'Số dư các ví đã được cập nhật.');
      }
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
