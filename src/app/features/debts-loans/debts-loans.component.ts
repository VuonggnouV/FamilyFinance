import {
  Component,
  ChangeDetectorRef,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DebtLoan,
  DebtLoanType,
  OWNER_SCOPE_META,
} from '../../core/models/database.models';
import { DebtLoanService } from '../../core/services/debt-loan.service';
import { WalletService } from '../../core/services/wallet.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
  getMoneySuggestions,
} from '../../shared/pipes/vnd.pipe';

@Component({
  selector: 'app-debts-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="toy-card-lg p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-14 h-14 rounded-2xl border-2 border-[#2D2A32] shadow-[0_4px_0_#2D2A32] flex items-center justify-center text-3xl shrink-0"
            [ngClass]="activeTab() === 'LEND' ? 'bg-[#FFB020]' : 'bg-[#9B6BFF] text-white'"
          >
            {{ activeTab() === 'LEND' ? '🤝' : '🏦' }}
          </div>
          <div>
            <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#2D2A32]">
              Sổ Cho Mượn & Vay Nợ
            </h1>
            <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
              Theo dõi trả góp từng đợt, tự động khóa sổ khi tất toán 100% kèm Hoàn tác 10 giây
            </p>
          </div>
        </div>

        <button
          type="button"
          (pointerdown)="onCreateBtnPointerDown($event)"
          (click)="onCreateBtnClick($event)"
          (contextmenu)="$event.preventDefault()"
          class="toy-btn px-5 py-3 text-sm font-extrabold select-none touch-none transition-all"
          [ngClass]="
            liveVoiceOverlayOpen() || holdingCreateBtn()
              ? 'bg-[#FF5C6C] text-white scale-105 animate-pulse'
              : activeTab() === 'LEND'
                ? 'bg-[#FFB020] text-[#2D2A32]'
                : 'bg-[#9B6BFF] text-white'
          "
          title="Bấm: Mở sổ • Nhấn giữ: Thu âm trực tiếp, thả tay mở sổ 🎙️"
        >
          {{
            liveVoiceOverlayOpen()
              ? '🎙️ Đang nghe...'
              : activeTab() === 'LEND'
                ? '+ Ghi khoản Cho Mượn mới 🤝'
                : '+ Ghi khoản Nợ mới 🏦'
          }}
        </button>
      </div>

      <!-- 2 Distinct Tabs: Cho mượn (Orange #FFB020) vs Nợ (Purple #9B6BFF) -->
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          (click)="activeTab.set('LEND')"
          class="toy-btn py-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-2"
          [ngClass]="
            activeTab() === 'LEND'
              ? 'bg-[#FFB020] text-[#2D2A32] -translate-y-0.5'
              : 'bg-white text-[#2D2A32]/75'
          "
        >
          <div class="flex items-center gap-2 text-base sm:text-lg font-extrabold">
            <span>🤝 Cho Mượn (LEND)</span>
          </div>
          <div class="money-num font-extrabold text-sm sm:text-base px-3 py-0.5 rounded-full bg-white border border-[#2D2A32] text-[#B45309]">
            Đang cho mượn: {{ debtLoanService.totalOpenLend() | vnd }}
          </div>
        </button>

        <button
          type="button"
          (click)="activeTab.set('DEBT')"
          class="toy-btn py-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-2"
          [ngClass]="
            activeTab() === 'DEBT'
              ? 'bg-[#9B6BFF] text-white -translate-y-0.5'
              : 'bg-white text-[#2D2A32]/75'
          "
        >
          <div class="flex items-center gap-2 text-base sm:text-lg font-extrabold">
            <span>🏦 Khoản Nợ (DEBT)</span>
          </div>
          <div class="money-num font-extrabold text-sm sm:text-base px-3 py-0.5 rounded-full bg-white border border-[#2D2A32] text-[#6D28D9]">
            Còn đang nợ: {{ debtLoanService.totalOpenDebt() | vnd }}
          </div>
        </button>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of currentItems(); track item.id) {
          <div
            class="toy-card p-5 bg-white flex flex-col justify-between space-y-4 relative overflow-hidden"
            [class.opacity-75]="item.status === 'PAID'"
          >
            <!-- Top Row: Counterparty + Status / Overdue Badge -->
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-extrabold border-2 border-[#2D2A32]"
                    [ngClass]="
                      item.type === 'LEND'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#EDE9FE] text-[#6D28D9]'
                    "
                  >
                    {{ item.type === 'LEND' ? '🤝 Cho mượn' : '🏦 Khoản nợ' }}
                  </span>
                </div>

                <h3 class="font-display font-extrabold text-xl text-[#2D2A32] mt-2 flex items-center gap-1.5">
                  <span>{{ item.counterparty }}</span>
                  @if (item.is_locked || item.status === 'PAID') {
                    <span title="Đã tất toán & khóa sổ cứng" class="text-sm">🔒</span>
                  }
                </h3>

                <div class="text-xs font-bold text-[#2D2A32]/70 mt-0.5">
                  Ví: {{ getWalletNameWithOwner(item.wallet_id) }} • Ngày tạo: {{ item.transaction_date }}
                  @if (item.type === 'DEBT') {
                    <span>
                      • {{ item.affects_balance ? '✅ Có cộng vào tiền tổng' : '⚪ Không cộng tiền tổng' }}
                    </span>
                  }
                </div>
              </div>

              <!-- Status or Overdue Bell -->
              <div class="flex flex-col items-end gap-1.5 shrink-0">
                @if (item.status === 'PAID') {
                  <span
                    class="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                  >
                    🎉 Đã tất toán 100%
                  </span>
                } @else if (isOverdue(item)) {
                  <span
                    class="px-3 py-1 rounded-full bg-[#FF5C6C] text-white border-2 border-[#2D2A32] font-display font-extrabold text-xs animate-bell"
                  >
                    {{ item.type === 'LEND' ? 'Alo bạn ơi trả tiền! 🔔' : 'Quá hạn trả nợ! 🔔' }}
                  </span>
                } @else {
                  <span
                    class="px-3 py-1 rounded-full bg-[#FFF9EC] text-[#2D2A32] border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                  >
                    Đang mở (OPEN)
                  </span>
                }

                @if (item.due_date) {
                  <span class="text-[11px] font-extrabold text-[#2D2A32]/75">
                    📅 Hạn: {{ item.due_date }}
                  </span>
                }
              </div>
            </div>

            @if (item.note) {
              <div class="text-xs font-semibold text-[#2D2A32]/80 bg-[#FFFDF5] p-2.5 rounded-xl border border-[#2D2A32]/20">
                💬 "{{ item.note }}"
              </div>
            }

            <!-- Progress Bar: Đã trả / Tổng gốc -->
            <div class="p-3.5 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2A32] space-y-2">
              <div class="flex items-center justify-between text-xs font-extrabold">
                <span>
                  Tiến độ:
                  <span class="money-num text-[#15803D]">{{ item.paid_amount | vnd }}</span>
                  /
                  <span class="money-num text-[#2D2A32]">{{ item.principal_amount | vnd }}</span>
                </span>
                <span class="money-num px-2 py-0.5 rounded-full bg-white border border-[#2D2A32]">
                  {{ getProgressPercent(item) }}%
                </span>
              </div>

              <div class="w-full h-3.5 bg-white rounded-full border-2 border-[#2D2A32] overflow-hidden p-0.5">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  [style.width.%]="getProgressPercent(item)"
                  [ngClass]="
                    item.type === 'LEND' ? 'bg-[#FFB020]' : 'bg-[#9B6BFF]'
                  "
                ></div>
              </div>

              <div class="flex items-center justify-between text-xs font-bold text-[#2D2A32]/75">
                <span>Còn lại chưa trả:</span>
                <span class="money-num font-extrabold text-sm text-[#BE123C]">
                  {{ getRemaining(item) | vnd }}
                </span>
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                (click)="openHistoryDrawer(item)"
                class="toy-btn px-3 py-2 bg-[#FFF9EC] text-xs font-extrabold"
              >
                📜 Lịch sử trả ({{ getRepaymentCount(item.id) }} đợt)
              </button>

              <div class="flex items-center gap-1.5">
                @if (item.status === 'OPEN' && !item.is_locked) {
                  <button
                    type="button"
                    (click)="openRepaymentModal(item)"
                    class="toy-btn px-3.5 py-2 bg-[#22C55E] text-white text-xs font-extrabold"
                  >
                    💸 Ghi nhận trả
                  </button>
                  <button
                    type="button"
                    (click)="openEditModal(item)"
                    class="toy-btn px-2.5 py-2 bg-white text-xs"
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    (click)="onDelete(item)"
                    class="toy-btn px-2.5 py-2 bg-[#FFE4E6] text-xs"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                } @else {
                  <span class="text-xs font-extrabold text-[#2D2A32]/60 px-2 py-1">
                    🔒 Đã khóa sổ vĩnh viễn
                  </span>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="md:col-span-2 toy-card p-10 bg-white text-center">
            <div class="text-5xl mb-3">
              {{ activeTab() === 'LEND' ? '🤝✨' : '🏦✨' }}
            </div>
            <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
              {{
                activeTab() === 'LEND'
                  ? 'Chưa có khoản Cho Mượn nào!'
                  : 'Tuyệt vời! Nhà mình đang không nợ ai đồng nào!'
              }}
            </h3>
            <p class="text-xs font-bold text-[#2D2A32]/70 mt-1">
              Bấm nút góc trên bên phải nếu bạn cần ghi sổ theo dõi khoản mượn hoặc nợ mới nhé.
            </p>
          </div>
        }
      </div>

      <!-- MODAL 1: Create / Edit Debt or Loan (No Actor Field + .000 button + Instant Close) -->
      @if (formModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A32]/60 backdrop-blur-xs overflow-y-auto"
          (click)="formModalOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-lg p-6 bg-[#FFFDF5] my-auto space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <div class="flex items-center gap-2.5">
                <span class="text-3xl">{{ formType() === 'LEND' ? '🤝' : '🏦' }}</span>
                <div>
                  <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                    {{
                      editingItem()
                        ? 'Sửa thông tin sổ nợ/mượn ✏️'
                        : formType() === 'LEND'
                          ? 'Ghi khoản Cho Mượn mới 🤝'
                          : 'Ghi khoản Vay / Nợ mới 🏦'
                    }}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                (click)="formModalOpen.set(false)"
                class="toy-btn px-2.5 py-1 bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="onSaveDebtLoan()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  {{ formType() === 'LEND' ? 'Cho ai mượn? *' : 'Nợ ai / Ngân hàng nào? *' }}
                </label>
                <input
                  type="text"
                  name="counterparty"
                  [ngModel]="counterparty()"
                  (ngModelChange)="counterparty.set($event)"
                  placeholder="VD: Bạn Tuấn, Em gái, Thẻ tín dụng VPBank..."
                  required
                  class="toy-input bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Số tiền gốc (VND) *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    inputmode="numeric"
                    name="principalDisplay"
                    [ngModel]="principalDisplay()"
                    (ngModelChange)="onPrincipalInput($event)"
                    placeholder="0"
                    required
                    class="toy-input money-num text-2xl font-extrabold bg-white pr-24"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    @if (principalDisplay()) {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="clearPrincipalAmount()"
                        class="px-2.5 py-1 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FFE4E6] hover:bg-[#FF5C6C] text-[#BE123C] hover:text-white shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer transition-colors"
                        title="Xóa số tiền vừa nhập"
                      >
                        ✕ Xóa
                      </button>
                    } @else {
                      <span class="font-display font-extrabold text-sm text-[#2D2A32]/60">
                        VNĐ
                      </span>
                    }
                  </div>
                </div>
                @if (principalSuggestions().length > 0) {
                  <div class="grid grid-cols-3 gap-2 mt-2">
                    @for (sug of principalSuggestions(); track sug.raw) {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="applyPrincipalSuggestion(sug.display)"
                        class="py-1.5 px-2 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FEF3C7] hover:bg-[#FFB020] text-[#2D2A32] shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer money-num text-center truncate transition-colors"
                      >
                        {{ sug.display }} ₫
                      </button>
                    }
                  </div>
                }
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  {{ formType() === 'LEND' ? 'Ví xuất tiền cho mượn *' : 'Ví nhận tiền / Ví trả *' }}
                </label>
                <select
                  name="walletId"
                  [ngModel]="walletId()"
                  (ngModelChange)="walletId.set($event)"
                  required
                  class="toy-input bg-white"
                >
                  @for (w of walletService.activeWallets(); track w.id) {
                    <option [value]="w.id">
                      {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }} ({{ w.current_balance | vnd }})
                    </option>
                  }
                </select>
              </div>

              <!-- MANDATORY TOGGLE SWITCH FOR DEBT: "Cộng vào tiền tổng hiện tại?" mapped to affects_balance -->
              @if (formType() === 'DEBT') {
                <div
                  (click)="affectsBalance.set(!affectsBalance())"
                  class="p-3.5 rounded-2xl border-2 border-[#2D2A32] bg-[#EDE9FE] flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div>
                    <div class="font-display font-extrabold text-sm text-[#2D2A32]">
                      Cộng vào tiền tổng hiện tại?
                    </div>
                    <div class="text-xs font-semibold text-[#2D2A32]/75">
                      Bật nếu khoản vay này giải ngân tiền mặt/chuyển khoản thẳng vào ví của bạn
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    [attr.aria-checked]="affectsBalance()"
                    class="w-14 h-8 rounded-full border-2 border-[#2D2A32] p-0.5 transition-colors relative shrink-0 cursor-pointer"
                    [ngClass]="affectsBalance() ? 'bg-[#22C55E]' : 'bg-white'"
                  >
                    <span
                      class="block w-6 h-6 rounded-full bg-[#2D2A32] transition-transform"
                      [class.translate-x-6]="affectsBalance()"
                    ></span>
                  </button>
                </div>
              }

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Ngày tạo *
                  </label>
                  <input
                    type="date"
                    name="txDate"
                    [ngModel]="transactionDate()"
                    (ngModelChange)="transactionDate.set($event)"
                    required
                    class="toy-input bg-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Ngày hẹn trả (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    [ngModel]="dueDate()"
                    (ngModelChange)="dueDate.set($event)"
                    class="toy-input bg-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  rows="2"
                  [ngModel]="note()"
                  (ngModelChange)="note.set($event)"
                  placeholder="Ghi chú thêm về lãi suất hoặc lịch hẹn..."
                  class="toy-input bg-white resize-none"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2.5 pt-2">
                @if (savedDone()) {
                  <button
                    type="button"
                    (click)="formModalOpen.set(false)"
                    class="toy-btn w-full py-3 bg-[#22C55E] text-white text-base font-extrabold"
                  >
                    ✅ Đã lưu xong! (Đóng)
                  </button>
                } @else {
                  <button
                    type="button"
                    [disabled]="submitting()"
                    (click)="formModalOpen.set(false)"
                    class="toy-btn px-4 py-2.5 bg-white text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    [disabled]="submitting()"
                    class="toy-btn px-6 py-2.5 text-sm font-extrabold"
                    [ngClass]="
                      formType() === 'LEND'
                        ? 'bg-[#FFB020] text-[#2D2A32]'
                        : 'bg-[#9B6BFF] text-white'
                    "
                  >
                    {{ submitting() ? '⏳ Đang lưu...' : '💾 Lưu vào sổ' }}
                  </button>
                }
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 2: Record Repayment (Ghi nhận trả từng đợt + .000 button) -->
      @if (repaymentModalOpen() && repayingItem()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A32]/60 backdrop-blur-xs"
          (click)="repaymentModalOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between border-b-2 border-dashed border-[#2D2A32]/20 pb-3">
              <div>
                <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                  💸 Ghi nhận đợt trả tiền
                </h3>
                <p class="text-xs font-bold text-[#2D2A32]/70">
                  {{ repayingItem()!.counterparty }} • Còn lại:
                  <span class="money-num font-extrabold text-[#BE123C]">
                    {{ getRemaining(repayingItem()!) | vnd }}
                  </span>
                </p>
              </div>
              <button
                type="button"
                (click)="repaymentModalOpen.set(false)"
                class="toy-btn px-2.5 py-1 bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="onConfirmRepayment()" class="space-y-3.5">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-extrabold uppercase text-[#2D2A32]/75">
                    Số tiền trả đợt này (VND) *
                  </label>
                  <button
                    type="button"
                    (click)="fillFullRemaining()"
                    class="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] border border-[#15803D] text-[#15803D] font-display font-extrabold text-xs cursor-pointer hover:bg-[#22C55E] hover:text-white transition-colors"
                  >
                    ⚡ Trả hết phần còn lại
                  </button>
                </div>
                <div class="relative">
                  <input
                    type="text"
                    inputmode="numeric"
                    name="repayAmountDisplay"
                    [ngModel]="repayAmountDisplay()"
                    (ngModelChange)="onRepayAmountInput($event)"
                    placeholder="0"
                    required
                    class="toy-input money-num text-2xl font-extrabold text-[#15803D] bg-white pr-24"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    @if (repayAmountDisplay()) {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="clearRepayAmount()"
                        class="px-2.5 py-1 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FFE4E6] hover:bg-[#FF5C6C] text-[#BE123C] hover:text-white shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer transition-colors"
                        title="Xóa số tiền vừa nhập"
                      >
                        ✕ Xóa
                      </button>
                    } @else {
                      <span class="font-display font-extrabold text-sm text-[#2D2A32]/60">
                        VNĐ
                      </span>
                    }
                  </div>
                </div>
                @if (repaySuggestions().length > 0) {
                  <div class="grid grid-cols-3 gap-2 mt-2">
                    @for (sug of repaySuggestions(); track sug.raw) {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="applyRepaySuggestion(sug.display)"
                        class="py-1.5 px-2 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FEF3C7] hover:bg-[#FFB020] text-[#2D2A32] shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer money-num text-center truncate transition-colors"
                      >
                        {{ sug.display }} ₫
                      </button>
                    }
                  </div>
                }
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  {{
                    repayingItem()!.type === 'LEND'
                      ? 'Ví nhận tiền thu hồi về *'
                      : 'Ví xuất tiền đi trả nợ *'
                  }}
                </label>
                <select
                  name="repayWalletId"
                  [ngModel]="repayWalletId()"
                  (ngModelChange)="repayWalletId.set($event)"
                  required
                  class="toy-input bg-white"
                >
                  @for (w of walletService.activeWallets(); track w.id) {
                    <option [value]="w.id">
                      {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }} ({{ w.current_balance | vnd }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Ngày trả *
                </label>
                <input
                  type="date"
                  name="repayDate"
                  [ngModel]="repayDate()"
                  (ngModelChange)="repayDate.set($event)"
                  required
                  class="toy-input bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Ghi chú đợt trả
                </label>
                <input
                  type="text"
                  name="repayNote"
                  [ngModel]="repayNote()"
                  (ngModelChange)="repayNote.set($event)"
                  placeholder="VD: Chuyển khoản đợt 1..."
                  class="toy-input bg-white"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                @if (repayDone()) {
                  <button
                    type="button"
                    (click)="repaymentModalOpen.set(false)"
                    class="toy-btn w-full py-3 bg-[#22C55E] text-white text-base font-extrabold"
                  >
                    ✅ Đã ghi nhận xong! (Đóng)
                  </button>
                } @else {
                  <button
                    type="button"
                    [disabled]="submitting()"
                    (click)="repaymentModalOpen.set(false)"
                    class="toy-btn px-4 py-2.5 bg-white text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    [disabled]="submitting()"
                    class="toy-btn px-5 py-2.5 bg-[#22C55E] text-white text-sm font-extrabold"
                  >
                    {{ submitting() ? '⏳ Đang ghi nhận...' : '✅ Xác nhận trả tiền' }}
                  </button>
                }
              </div>
            </form>
          </div>
        </div>
      }

      <!-- DRAWER / MODAL 3: Repayment History List -->
      @if (historyDrawerOpen() && historyItem()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-end bg-[#2D2A32]/60 backdrop-blur-xs"
          (click)="historyDrawerOpen.set(false)"
        >
          <div
            class="w-full max-w-md h-full bg-[#FFFDF5] border-l-3 border-[#2D2A32] p-6 flex flex-col justify-between overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
                <div>
                  <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                    📜 Lịch sử các đợt trả
                  </h3>
                  <p class="text-xs font-bold text-[#2D2A32]/75">
                    {{ historyItem()!.counterparty }} ({{ historyItem()!.paid_amount | vnd }} / {{ historyItem()!.principal_amount | vnd }})
                  </p>
                </div>
                <button
                  type="button"
                  (click)="historyDrawerOpen.set(false)"
                  class="toy-btn px-3 py-1 bg-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div class="space-y-3">
                @for (rep of debtLoanService.getRepaymentsFor(historyItem()!.id); track rep.id) {
                  <div class="toy-card p-3.5 bg-white flex items-center justify-between gap-3">
                    <div>
                      <div class="font-display font-extrabold text-sm text-[#2D2A32]">
                        📅 {{ rep.paid_date }}
                      </div>
                      <div class="text-xs font-bold text-[#2D2A32]/70">
                        Ví: {{ getWalletNameWithOwner(rep.wallet_id) }}
                      </div>
                      @if (rep.note) {
                        <div class="text-xs font-semibold text-[#2D2A32]/80 mt-0.5">
                          "{{ rep.note }}"
                        </div>
                      }
                    </div>
                    <div class="money-num font-extrabold text-base text-[#15803D]">
                      +{{ rep.amount | vnd }}
                    </div>
                  </div>
                } @empty {
                  <div class="toy-card p-6 bg-white text-center">
                    <div class="text-3xl mb-1">🍃</div>
                    <p class="font-display font-extrabold text-sm text-[#2D2A32]">
                      Chưa có đợt trả nào được ghi nhận!
                    </p>
                  </div>
                }
              </div>
            </div>

            <button
              type="button"
              (click)="historyDrawerOpen.set(false)"
              class="toy-btn w-full py-3 bg-[#FFB020] text-[#2D2A32] text-sm font-extrabold mt-6"
            >
              Đóng lịch sử
            </button>
          </div>
        </div>
      }

      <!-- LIVE VOICE OVERLAY POPUP CHO NÚT GHI KHOẢN CHO MƯỢN MỚI & GHI KHOẢN NỢ MỚI -->
      @if (liveVoiceOverlayOpen()) {
        <div
          class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D2A32]/70 backdrop-blur-md select-none"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <!-- Top Badge -->
            <div
              class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-[#2D2A32] font-display font-extrabold text-xs"
              [ngClass]="
                activeTab() === 'LEND'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#EDE9FE] text-[#6D28D9]'
              "
            >
              <span class="w-2.5 h-2.5 rounded-full bg-[#FF5C6C] animate-ping"></span>
              <span>
                {{
                  activeTab() === 'LEND'
                    ? 'ĐANG THU ÂM KHOẢN CHO MƯỢN MỚI 🤝'
                    : 'ĐANG THU ÂM KHOẢN VAY / NỢ MỚI 🏦'
                }}
              </span>
            </div>

            <!-- Pulsing Microphone Toy Icon -->
            <div class="flex justify-center">
              <div
                class="w-20 h-20 rounded-full bg-[#FF5C6C] text-white border-3 border-[#2D2A32] shadow-[0_4px_0_#2D2A32] flex items-center justify-center text-4xl animate-pulse"
              >
                🎙️
              </div>
            </div>

            <!-- Live Running Transcript Box -->
            <div class="p-4 rounded-2xl bg-white border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] min-h-24 flex flex-col items-center justify-center">
              @if (liveVoiceTranscript()) {
                <p class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32] leading-snug break-words">
                  “{{ liveVoiceTranscript() }}”
                </p>
              } @else {
                <p class="font-display font-bold text-sm sm:text-base text-[#2D2A32]/55">
                  {{
                    activeTab() === 'LEND'
                      ? 'Hãy nói tên người mượn + số tiền...'
                      : 'Hãy nói tên chủ nợ / ngân hàng + số tiền...'
                  }}
                </p>
                <p class="text-xs font-bold text-[#2D2A32]/45 mt-1">
                  {{
                    activeTab() === 'LEND'
                      ? 'VD: "Cho bạn Tuấn mượn 2 triệu", "Em gái 500 nghìn"'
                      : 'VD: "Nợ anh Hùng 5 triệu", "Thẻ tín dụng VPBank 3 triệu rưỡi"'
                  }}
                </p>
              }
            </div>

            <!-- Real-time Parsed Preview Pills -->
            <div class="grid grid-cols-2 gap-2.5 text-left">
              <div class="p-2.5 rounded-xl bg-[#FFF9EC] border-2 border-[#2D2A32]">
                <div class="text-[10px] font-extrabold uppercase text-[#2D2A32]/60">
                  👤 {{ activeTab() === 'LEND' ? 'Cho ai mượn' : 'Nợ ai' }}
                </div>
                <div class="font-display font-extrabold text-sm text-[#2D2A32] truncate mt-0.5">
                  {{ liveVoiceParsed().counterparty || 'Đang chờ...' }}
                </div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#FFE4E6]/60 border-2 border-[#2D2A32]">
                <div class="text-[10px] font-extrabold uppercase text-[#2D2A32]/60">
                  💰 Số tiền gốc
                </div>
                <div class="money-num font-extrabold text-sm text-[#BE123C] truncate mt-0.5">
                  {{ liveVoiceParsed().amount ? (liveVoiceParsed().amount | vnd) : '0 ₫' }}
                </div>
              </div>
            </div>

            <div class="pt-1">
              <div class="text-xs font-extrabold text-[#2D2A32]/75">
                ✨ Thả tay ra để mở sổ điền sẵn thông tin trên
              </div>
              <button
                type="button"
                (click)="finishLiveVoiceAndOpenModal()"
                class="mt-2 px-4 py-1.5 rounded-xl border-2 border-[#2D2A32] bg-[#FFB020] text-[#2D2A32] font-display font-extrabold text-xs cursor-pointer"
              >
                ✅ Mở sổ ngay
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DebtsLoansComponent implements OnDestroy {
  readonly debtLoanService = inject(DebtLoanService);
  readonly walletService = inject(WalletService);
  private readonly voiceInput = inject(VoiceInputService);
  private readonly toast = inject(ToastService);
  private readonly confetti = inject(ConfettiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly ownerMeta = OWNER_SCOPE_META;
  readonly activeTab = signal<DebtLoanType>('LEND');

  // Live Voice Overlay State for "+ Ghi khoản Cho Mượn mới" & "+ Ghi khoản Nợ mới"
  readonly holdingCreateBtn = signal<boolean>(false);
  readonly liveVoiceOverlayOpen = signal<boolean>(false);
  readonly liveVoiceTranscript = signal<string>('');
  readonly liveVoiceParsed = computed(() =>
    this.voiceInput.parseSmartDebtLoan(this.liveVoiceTranscript())
  );

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private finalizeTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;
  private isFinishingVoice = false;
  private readonly boundGlobalRelease = () => this.onGlobalPointerRelease();

  readonly currentItems = computed(() =>
    this.activeTab() === 'LEND'
      ? this.debtLoanService.lends()
      : this.debtLoanService.debts()
  );

  // Create/Edit Modal State
  readonly formModalOpen = signal<boolean>(false);
  readonly formType = signal<DebtLoanType>('LEND');
  readonly editingItem = signal<DebtLoan | null>(null);
  readonly counterparty = signal<string>('');
  readonly principalDisplay = signal<string>('');
  readonly showPrincipalSuggestions = signal<boolean>(true);
  readonly walletId = signal<string>('');
  readonly affectsBalance = signal<boolean>(true);
  readonly transactionDate = signal<string>(this.todayIso());
  readonly dueDate = signal<string>('');
  readonly note = signal<string>('');
  readonly submitting = signal<boolean>(false);
  readonly savedDone = signal<boolean>(false);

  // Repayment Modal State
  readonly repaymentModalOpen = signal<boolean>(false);
  readonly repayingItem = signal<DebtLoan | null>(null);
  readonly repayAmountDisplay = signal<string>('');
  readonly showRepaySuggestions = signal<boolean>(false);
  readonly repayWalletId = signal<string>('');
  readonly repayDate = signal<string>(this.todayIso());
  readonly repayNote = signal<string>('');
  readonly repayDone = signal<boolean>(false);

  // History Drawer State
  readonly historyDrawerOpen = signal<boolean>(false);
  readonly historyItem = signal<DebtLoan | null>(null);

  readonly principalSuggestions = computed(() => {
    if (!this.showPrincipalSuggestions()) return [];
    return getMoneySuggestions(this.principalDisplay());
  });

  readonly repaySuggestions = computed(() => {
    if (!this.showRepaySuggestions()) return [];
    return getMoneySuggestions(this.repayAmountDisplay());
  });

  formatVnd(val: string): string {
    return formatVndInput(val);
  }

  onPrincipalInput(val: string): void {
    this.showPrincipalSuggestions.set(true);
    this.principalDisplay.set(formatVndInput(val));
  }

  applyPrincipalSuggestion(display: string): void {
    this.principalDisplay.set(display);
    this.showPrincipalSuggestions.set(false);
  }

  clearPrincipalAmount(): void {
    this.principalDisplay.set('');
    this.showPrincipalSuggestions.set(true);
  }

  onRepayAmountInput(val: string): void {
    this.showRepaySuggestions.set(true);
    this.repayAmountDisplay.set(formatVndInput(val));
  }

  applyRepaySuggestion(display: string): void {
    this.repayAmountDisplay.set(display);
    this.showRepaySuggestions.set(false);
  }

  clearRepayAmount(): void {
    this.repayAmountDisplay.set('');
    this.showRepaySuggestions.set(true);
  }

  getWalletNameWithOwner(walletId: string): string {
    const w = this.walletService.getWalletById(walletId);
    if (!w) return 'Ví';
    return `${this.ownerMeta[w.owner_scope].emoji} ${w.name}`;
  }

  getRemaining(item: DebtLoan): number {
    return Math.max(
      0,
      Number(item.principal_amount || 0) - Number(item.paid_amount || 0)
    );
  }

  getProgressPercent(item: DebtLoan): number {
    const p = Number(item.principal_amount || 0);
    if (p <= 0) return 0;
    return Math.min(100, Math.round((Number(item.paid_amount || 0) / p) * 100));
  }

  getRepaymentCount(id: string): number {
    return this.debtLoanService.getRepaymentsFor(id).length;
  }

  isOverdue(item: DebtLoan): boolean {
    if (item.status !== 'OPEN' || !item.due_date) return false;
    const today = this.todayIso();
    return item.due_date < today;
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
    this.removeGlobalReleaseListeners();
  }

  onCreateBtnPointerDown(_event: PointerEvent): void {
    this.clearHoldTimer();
    this.longPressTriggered = false;
    this.isFinishingVoice = false;
    this.holdingCreateBtn.set(true);
    this.attachGlobalReleaseListeners();

    this.holdTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.holdingCreateBtn.set(false);
      this.startLiveVoiceOverlay();
    }, 650);
  }

  private startLiveVoiceOverlay(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(45);
    }
    this.liveVoiceTranscript.set('');
    this.liveVoiceOverlayOpen.set(true);
    this.cdr.detectChanges();

    const started = this.voiceInput.startListening({
      onTranscript: (text) => {
        this.liveVoiceTranscript.set(text);
        this.cdr.detectChanges();
      },
      onError: (msg) => {
        this.toast.show('warning', 'Micro thông báo 🎙️', msg);
      },
    });

    if (!started) {
      this.liveVoiceOverlayOpen.set(false);
      this.removeGlobalReleaseListeners();
      this.openCreateModal();
      this.cdr.detectChanges();
    }
  }

  private onGlobalPointerRelease(): void {
    this.clearHoldTimer();
    this.holdingCreateBtn.set(false);
    this.removeGlobalReleaseListeners();

    if (this.longPressTriggered && this.liveVoiceOverlayOpen()) {
      this.finishLiveVoiceAndOpenModal();
    }
  }

  finishLiveVoiceAndOpenModal(): void {
    if (this.isFinishingVoice) return;
    this.isFinishingVoice = true;
    this.removeGlobalReleaseListeners();

    this.voiceInput.stopListening(250);
    if (this.finalizeTimer) clearTimeout(this.finalizeTimer);
    this.finalizeTimer = setTimeout(() => {
      const parsed = this.liveVoiceParsed();
      this.liveVoiceOverlayOpen.set(false);
      this.isFinishingVoice = false;
      this.openCreateModal(parsed.rawText ? parsed : undefined);
      this.cdr.detectChanges();
    }, 320);
  }

  onCreateBtnClick(event: MouseEvent): void {
    if (this.longPressTriggered) {
      event.preventDefault();
      event.stopPropagation();
      this.longPressTriggered = false;
      return;
    }
    this.openCreateModal();
  }

  private attachGlobalReleaseListeners(): void {
    if (typeof window === 'undefined') return;
    this.removeGlobalReleaseListeners();
    window.addEventListener('pointerup', this.boundGlobalRelease);
    window.addEventListener('pointercancel', this.boundGlobalRelease);
    window.addEventListener('touchend', this.boundGlobalRelease);
    window.addEventListener('touchcancel', this.boundGlobalRelease);
  }

  private removeGlobalReleaseListeners(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointerup', this.boundGlobalRelease);
    window.removeEventListener('pointercancel', this.boundGlobalRelease);
    window.removeEventListener('touchend', this.boundGlobalRelease);
    window.removeEventListener('touchcancel', this.boundGlobalRelease);
  }

  private clearHoldTimer(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.finalizeTimer) {
      clearTimeout(this.finalizeTimer);
      this.finalizeTimer = null;
    }
  }

  openCreateModal(voicePrefill?: {
    counterparty: string;
    amount: number | null;
    rawText: string;
  }): void {
    this.submitting.set(false);
    this.savedDone.set(false);
    this.editingItem.set(null);
    this.formType.set(this.activeTab());
    this.counterparty.set(voicePrefill?.counterparty ?? '');
    if (voicePrefill?.amount && voicePrefill.amount > 0) {
      this.principalDisplay.set(formatVndInput(voicePrefill.amount));
      this.showPrincipalSuggestions.set(false);
    } else {
      this.principalDisplay.set('');
      this.showPrincipalSuggestions.set(true);
    }
    const firstW = this.walletService.activeWallets()[0];
    this.walletId.set(firstW?.id ?? '');
    this.affectsBalance.set(true);
    this.transactionDate.set(this.todayIso());
    this.dueDate.set('');
    this.note.set('');
    this.formModalOpen.set(true);
  }

  openEditModal(item: DebtLoan): void {
    if (item.is_locked || item.status === 'PAID') return;
    this.submitting.set(false);
    this.savedDone.set(false);
    this.editingItem.set(item);
    this.formType.set(item.type);
    this.counterparty.set(item.counterparty);
    this.principalDisplay.set(formatVndInput(item.principal_amount));
    this.walletId.set(item.wallet_id);
    this.affectsBalance.set(Boolean(item.affects_balance));
    this.transactionDate.set(item.transaction_date);
    this.dueDate.set(item.due_date ?? '');
    this.note.set(item.note ?? '');
    this.formModalOpen.set(true);
  }

  async onSaveDebtLoan(): Promise<void> {
    if (this.submitting() || this.savedDone()) return;

    const principal = parseVndInput(this.principalDisplay());
    if (!this.counterparty().trim()) {
      this.toast.show('warning', 'Thiếu tên người! 🤝', 'Hãy nhập tên người mượn hoặc chủ nợ.');
      return;
    }
    if (principal <= 0) {
      this.toast.show('warning', 'Số tiền chưa hợp lệ! 💰', 'Số tiền gốc phải lớn hơn 0.');
      return;
    }
    if (!this.walletId()) {
      this.toast.show('warning', 'Chọn ví nha! 👛', 'Vui lòng chọn ví liên kết.');
      return;
    }

    const selectedWallet = this.walletService.getWalletById(this.walletId());
    const derivedActor = selectedWallet?.owner_scope ?? 'SHARED';

    this.submitting.set(true);
    try {
      const edit = this.editingItem();
      const targetName = this.counterparty();
      const currentFormType = this.formType();
      if (edit) {
        await this.debtLoanService.updateDebtLoan(edit.id, {
          counterparty: targetName,
          principal_amount: principal,
          wallet_id: this.walletId(),
          actor: derivedActor,
          affects_balance:
            currentFormType === 'DEBT' ? this.affectsBalance() : true,
          transaction_date: this.transactionDate(),
          due_date: this.dueDate() || null,
          note: this.note() || null,
        });
      } else {
        await this.debtLoanService.createDebtLoan({
          type: currentFormType,
          counterparty: targetName,
          principal_amount: principal,
          wallet_id: this.walletId(),
          actor: derivedActor,
          affects_balance:
            currentFormType === 'DEBT' ? this.affectsBalance() : true,
          transaction_date: this.transactionDate(),
          due_date: this.dueDate() || null,
          note: this.note() || null,
        });
      }
      // Close modal FIRST and flush DOM synchronously for mobile
      this.savedDone.set(true);
      this.formModalOpen.set(false);
      this.cdr.detectChanges();

      this.toast.show(
        'success',
        edit ? 'Đã cập nhật! ✨' : 'Đã ghi sổ thành công! 📝',
        edit
          ? 'Thông tin đã được lưu.'
          : `Đã thêm khoản ${currentFormType === 'LEND' ? 'Cho mượn' : 'Nợ'} với ${targetName}.`
      );
    } catch (err: any) {
      this.toast.show('error', 'Không thể lưu! 🚨', err?.message || 'Có lỗi xảy ra.');
    } finally {
      this.submitting.set(false);
      this.cdr.detectChanges();
    }
  }

  async onDelete(item: DebtLoan): Promise<void> {
    if (item.is_locked || item.status === 'PAID') return;
    if (!confirm(`Xóa khoản "${item.counterparty}" khỏi sổ?`)) return;

    try {
      await this.debtLoanService.deleteDebtLoan(item.id);
      this.toast.show('info', 'Đã xóa! 🗑️', `Đã xóa khoản "${item.counterparty}".`);
    } catch (err: any) {
      this.toast.show('error', 'Không thể xóa! 🚨', err?.message || 'Đã có đợt trả gắn với khoản này.');
    }
  }

  openRepaymentModal(item: DebtLoan): void {
    this.submitting.set(false);
    this.repayDone.set(false);
    this.repayingItem.set(item);
    this.repayAmountDisplay.set(formatVndInput(this.getRemaining(item)));
    this.repayWalletId.set(item.wallet_id);
    this.repayDate.set(this.todayIso());
    this.repayNote.set('');
    this.repaymentModalOpen.set(true);
  }

  fillFullRemaining(): void {
    const item = this.repayingItem();
    if (!item) return;
    this.repayAmountDisplay.set(formatVndInput(this.getRemaining(item)));
  }

  async onConfirmRepayment(): Promise<void> {
    if (this.submitting() || this.repayDone()) return;

    const item = this.repayingItem();
    if (!item) return;
    const amount = parseVndInput(this.repayAmountDisplay());
    const remaining = this.getRemaining(item);

    if (amount <= 0 || amount > remaining) {
      this.toast.show(
        'warning',
        'Kiểm tra số tiền trả! 💰',
        `Số tiền trả phải từ 1 ₫ đến ${formatVndInput(remaining)} ₫.`
      );
      return;
    }

    this.submitting.set(true);
    try {
      const { repaymentId, settled } =
        await this.debtLoanService.recordRepayment({
          p_debt_loan_id: item.id,
          p_amount: amount,
          p_wallet_id: this.repayWalletId() || item.wallet_id,
          p_paid_date: this.repayDate(),
          p_note: this.repayNote() || null,
        });

      this.repayDone.set(true);
      this.repaymentModalOpen.set(false);
      this.cdr.detectChanges();

      if (settled) {
        this.confetti.celebrate();

        if (repaymentId) {
          this.toast.showUndo(
            item.type === 'LEND'
              ? 'Đòi nợ thành công 100%! 🎉'
              : 'Tất toán sạch nợ 100%! 🎉',
            `Khoản "${item.counterparty}" đã trả đủ và tự động khóa sổ. Bạn có 10 giây để Hoàn tác nếu bấm nhầm!`,
            async () => {
              await this.debtLoanService.undoRepayment(repaymentId);
              this.toast.show(
                'info',
                'Đã hoàn tác đợt trả! ↩️',
                `Khoản "${item.counterparty}" đã được mở khóa trở lại trạng thái OPEN.`
              );
            }
          );
        }
      } else {
        this.toast.show(
          'success',
          'Đã ghi nhận đợt trả! 💸',
          `Đã ghi nhận ${formatVndInput(amount)} ₫ cho "${item.counterparty}".`
        );
      }
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không thể ghi nhận trả! 🚨',
        err?.message || 'Vui lòng thử lại.'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  openHistoryDrawer(item: DebtLoan): void {
    this.historyItem.set(item);
    this.historyDrawerOpen.set(true);
  }

  private todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }
}
