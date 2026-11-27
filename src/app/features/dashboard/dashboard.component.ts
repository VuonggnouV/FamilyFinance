import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { WalletService, WalletWithBalance } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DebtLoanService } from '../../core/services/debt-loan.service';
import { DataSyncService } from '../../core/services/data-sync.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Wallet,
  Transaction,
  OwnerScope,
  WalletType,
  OWNER_SCOPE_META,
  WALLET_TYPE_META,
} from '../../core/models/database.models';
import {
  PiggyMascotComponent,
  PiggyMood,
} from '../../shared/components/piggy-mascot.component';
import { TransactionFormModalComponent } from '../../shared/components/transaction-form-modal.component';
import { RefundModalComponent } from '../../shared/components/refund-modal.component';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
  getMoneySuggestions,
} from '../../shared/pipes/vnd.pipe';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PiggyMascotComponent,
    TransactionFormModalComponent,
    RefundModalComponent,
    VndPipe,
  ],
  template: `
    <div class="flex flex-col gap-6 sm:gap-8">
      <!-- 1. Piggy Mascot Header Banner -->
      <app-piggy-mascot
        [mood]="piggyMood()"
        [savingsRate]="periodKpis().savingsRate"
        [triggerCount]="transactionService.transactions().length"
      />

      <!-- ======================================================================= -->
      <!-- 2. TÀI SẢN & TỔNG TIỀN HIỆN CÓ (HIGHLIGHT ĐẬM NỔI BẬT)                  -->
      <!-- ======================================================================= -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Card Tổng tiền hiện có -->
        <div class="toy-card-lg p-5 sm:p-6 bg-[#FFF9EC] md:col-span-2 flex flex-col justify-between gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#2D2A32]">
              💰 TỔNG TIỀN HIỆN CÓ
            </span>

            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] border-2 border-[#2D2A32]"
              >
                {{ walletService.activeWallets().length }} ví
              </span>
              <button
                type="button"
                (click)="scrollToWalletDetails()"
                class="toy-btn px-3 py-1 bg-[#FFB020] hover:bg-[#FFA000] text-[#2D2A32] text-xs font-extrabold"
              >
                Chi tiết ↓
              </button>
            </div>
          </div>

          <!-- Highlighted Total Balance Box (Đập vào mắt ngay khi mở app) -->
          <div
            class="p-4 sm:p-5 rounded-2xl border-3 border-[#2D2A32] shadow-[0_4px_0_#2D2A32] flex items-center justify-between"
            [ngClass]="
              walletService.totalBalance() >= 0
                ? 'bg-[#DCFCE7]'
                : 'bg-[#FFE4E6]'
            "
          >
            <div
              class="money-num font-black text-3xl sm:text-5xl tracking-tight whitespace-nowrap"
              [ngClass]="
                walletService.totalBalance() >= 0
                  ? 'text-[#15803D]'
                  : 'text-[#BE123C]'
              "
            >
              {{ walletService.totalBalance() | vnd }}
            </div>
            <span class="text-2xl sm:text-3xl select-none">
              {{ walletService.totalBalance() >= 0 ? '💎' : '🚨' }}
            </span>
          </div>
        </div>

        <!-- Card Tổng đang Cho mượn (OPEN) & Tổng đang Nợ (OPEN) -->
        <div class="toy-card p-5 bg-white flex flex-col justify-between gap-3">
          <div class="p-3 rounded-2xl bg-[#FEF3C7] border-2 border-[#B45309]">
            <div class="flex items-center justify-between text-xs font-extrabold text-[#B45309]">
              <span>🤝 Đang Cho Mượn</span>
              <a routerLink="/debts-loans" class="underline">Xem →</a>
            </div>
            <div class="money-num font-extrabold text-xl text-[#B45309] mt-1 whitespace-nowrap">
              {{ debtLoanService.totalOpenLend() | vnd }}
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-[#EDE9FE] border-2 border-[#6D28D9]">
            <div class="flex items-center justify-between text-xs font-extrabold text-[#6D28D9]">
              <span>🏦 Đang Nợ</span>
              <a routerLink="/debts-loans" class="underline">Xem →</a>
            </div>
            <div class="money-num font-extrabold text-xl text-[#6D28D9] mt-1 whitespace-nowrap">
              {{ debtLoanService.totalOpenDebt() | vnd }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reminder Widget (Sắp đến hạn trong 7 ngày hoặc Quá hạn đòi/trả) -->
      @if (debtLoanService.dueReminders().length > 0) {
        <div class="toy-card p-5 bg-[#FFF9EC] border-2 border-[#2D2A32]">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl animate-bell">🔔</span>
              <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                Nhắc việc Đòi tiền & Trả nợ
              </h3>
            </div>
            <a
              routerLink="/debts-loans"
              class="toy-btn px-3 py-1.5 bg-[#FFB020] text-xs font-extrabold"
            >
              Xử lý →
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (rem of debtLoanService.dueReminders(); track rem.item.id) {
              <div
                class="p-3.5 rounded-2xl border-2 border-[#2D2A32] bg-white flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-[#2D2A32]"
                      [ngClass]="
                        rem.item.type === 'LEND'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#EDE9FE] text-[#6D28D9]'
                      "
                    >
                      {{ rem.item.type === 'LEND' ? 'Cho mượn' : 'Khoản nợ' }}
                    </span>
                    <span class="font-display font-extrabold text-base text-[#2D2A32] truncate">
                      {{ rem.item.counterparty }}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-[#2D2A32]/75 mt-1">
                    Hạn: {{ rem.item.due_date }} • Còn:
                    <span class="money-num font-extrabold text-[#2D2A32]">
                      {{ rem.item.principal_amount - rem.item.paid_amount | vnd }}
                    </span>
                  </div>
                </div>

                <div class="shrink-0">
                  @if (rem.isOverdue && rem.item.type === 'LEND') {
                    <span
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF5C6C] text-white border-2 border-[#2D2A32] font-display font-extrabold text-xs animate-bell"
                    >
                      Alo trả tiền! 🔔
                    </span>
                  } @else if (rem.isOverdue) {
                    <span
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF5C6C] text-white border-2 border-[#2D2A32] font-display font-extrabold text-xs animate-bell"
                    >
                      Quá hạn {{ -rem.diffDays }} ngày! 🚨
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#B45309] border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                    >
                      {{ rem.diffDays === 0 ? 'Hôm nay!' : 'Còn ' + rem.diffDays + ' ngày' }} ⏳
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================================= -->
      <!-- 3. HAI Ô VUÔNG KỀ NHAU: TỔNG THU (TRÁI) & TỔNG CHI (PHẢI)               -->
      <!--    Bấm vào ô nào hiện Popup Lịch sử giao dịch riêng cho Thu hoặc Chi    -->
      <!-- ======================================================================= -->
      <div class="grid grid-cols-2 gap-3.5 sm:gap-5">
        <!-- Ô bên trái: TỔNG THU -->
        <button
          type="button"
          (click)="openTxHistoryPopup('INCOME')"
          class="toy-card-lg p-3.5 sm:p-5 bg-[#DCFCE7] hover:bg-[#BBF7D0] active:translate-y-1 text-left flex flex-col justify-between min-h-[122px] sm:min-h-[140px] cursor-pointer transition-all"
        >
          <div class="flex items-center justify-between gap-1 w-full">
            <span class="font-display font-extrabold text-sm sm:text-lg text-[#15803D] whitespace-nowrap">
              🌾 Tổng Thu
            </span>
            <span class="px-2 py-0.5 rounded-full bg-white border border-[#2D2A32] text-[10px] sm:text-xs font-extrabold text-[#15803D] whitespace-nowrap">
              {{ periodKpis().incomeCount }} khoản
            </span>
          </div>

          <div class="my-2 px-2.5 py-2 rounded-xl bg-white border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32] w-full overflow-hidden">
            <div class="money-num font-black text-base sm:text-2xl md:text-3xl text-[#15803D] whitespace-nowrap">
              {{ periodKpis().totalIncome | vnd: true : 'plus' }}
            </div>
          </div>

          <div class="text-[11px] sm:text-xs font-extrabold text-[#15803D] flex items-center justify-between w-full">
            <span>Xem lịch sử thu</span>
            <span>➔</span>
          </div>
        </button>

        <!-- Ô bên phải: TỔNG CHI -->
        <button
          type="button"
          (click)="openTxHistoryPopup('EXPENSE')"
          class="toy-card-lg p-3.5 sm:p-5 bg-[#FFE4E6] hover:bg-[#FECDD3] active:translate-y-1 text-left flex flex-col justify-between min-h-[122px] sm:min-h-[140px] cursor-pointer transition-all"
        >
          <div class="flex items-center justify-between gap-1 w-full">
            <span class="font-display font-extrabold text-sm sm:text-lg text-[#BE123C] whitespace-nowrap">
              🛒 Tổng Chi
            </span>
            <span class="px-2 py-0.5 rounded-full bg-white border border-[#2D2A32] text-[10px] sm:text-xs font-extrabold text-[#BE123C] whitespace-nowrap">
              {{ periodKpis().expenseCount }} khoản
            </span>
          </div>

          <div class="my-2 px-2.5 py-2 rounded-xl bg-white border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32] w-full overflow-hidden">
            <div class="money-num font-black text-base sm:text-2xl md:text-3xl text-[#BE123C] whitespace-nowrap">
              {{ periodKpis().netExpense | vnd: true : 'minus' }}
            </div>
          </div>

          <div class="text-[11px] sm:text-xs font-extrabold text-[#BE123C] flex items-center justify-between w-full">
            <span>Xem lịch sử chi</span>
            <span>➔</span>
          </div>
        </button>
      </div>

      <!-- ======================================================================= -->
      <!-- 4. KHUNG BỘ LỌC (RÚT GỌN CÒN ĐÚNG CHỮ "BỘ LỌC", MẶC ĐỊNH ĐÓNG)          -->
      <!-- ======================================================================= -->
      <div class="toy-card-lg bg-white overflow-hidden">
        <div
          (click)="filterOpen.set(!filterOpen())"
          class="p-4 sm:p-5 bg-[#FFF9EC] flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#FEF3C7]/60 transition-colors"
          [class.border-b-2]="filterOpen()"
          [class.border-[#2D2A32]]="filterOpen()"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-[#FEF3C7] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32] flex items-center justify-center text-xl shrink-0"
            >
              🔍
            </div>
            <h3 class="font-display font-extrabold text-lg sm:text-xl text-[#2D2A32] whitespace-nowrap">
              Bộ lọc
            </h3>
          </div>

          <button
            type="button"
            class="toy-btn px-3.5 py-1.5 bg-white text-xs font-extrabold shrink-0"
          >
            {{ filterOpen() ? 'Thu gọn ▲' : 'Mở ▼' }}
          </button>
        </div>

        @if (filterOpen()) {
          <div class="p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-[#2D2A32]/15">
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  (click)="setThisMonthDraft()"
                  class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] font-display font-bold text-xs cursor-pointer transition-all"
                  [ngClass]="
                    draftRangePreset() === 'THIS_MONTH'
                      ? 'bg-[#FFB020] shadow-[0_2px_0_#2D2A32]'
                      : 'bg-[#FFFDF5] hover:bg-[#FEF3C7]'
                  "
                >
                  📅 Tháng này
                </button>
                <button
                  type="button"
                  (click)="setAllTimeDraft()"
                  class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] font-display font-bold text-xs cursor-pointer transition-all"
                  [ngClass]="
                    draftRangePreset() === 'ALL_TIME'
                      ? 'bg-[#FFB020] shadow-[0_2px_0_#2D2A32]'
                      : 'bg-[#FFFDF5] hover:bg-[#FEF3C7]'
                  "
                >
                  ♾️ Tất cả
                </button>
                <button
                  type="button"
                  (click)="resetAndApplyFilters()"
                  class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] bg-white hover:bg-[#FFE4E6] font-display font-bold text-xs cursor-pointer"
                >
                  🔄 Đặt lại
                </button>
              </div>
            </div>

            <!-- Filter Controls (Draft State) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                  Loại giao dịch
                </label>
                <select
                  [ngModel]="draftType()"
                  (ngModelChange)="draftType.set($event)"
                  class="toy-input !py-2 !px-3 text-xs bg-[#FFFDF5]"
                >
                  <option value="ALL">Tất cả Thu & Chi</option>
                  <option value="INCOME">🌾 Chỉ khoản Thu</option>
                  <option value="EXPENSE">🛒 Chỉ khoản Chi</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                  Nguồn tiền / Ví
                </label>
                <select
                  [ngModel]="draftWalletId()"
                  (ngModelChange)="draftWalletId.set($event)"
                  class="toy-input !py-2 !px-3 text-xs bg-[#FFFDF5]"
                >
                  <option value="ALL">👛 Tất cả ví</option>
                  @for (w of walletService.walletsWithBalance(); track w.id) {
                    <option [value]="w.id">
                      {{ ownerMeta[w.owner_scope].emoji }} {{ w.name }}
                    </option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                  Danh mục
                </label>
                <select
                  [ngModel]="draftCategoryId()"
                  (ngModelChange)="draftCategoryId.set($event)"
                  class="toy-input !py-2 !px-3 text-xs bg-[#FFFDF5]"
                >
                  <option value="ALL">🏷️ Tất cả danh mục</option>
                  @for (c of categoryService.categories(); track c.id) {
                    <option [value]="c.id">{{ c.icon }} {{ c.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  [ngModel]="draftStartDate()"
                  (ngModelChange)="onDraftDateChange('start', $event)"
                  class="toy-input !py-2 !px-3 text-xs bg-[#FFFDF5]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  [ngModel]="draftEndDate()"
                  (ngModelChange)="onDraftDateChange('end', $event)"
                  class="toy-input !py-2 !px-3 text-xs bg-[#FFFDF5]"
                />
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t-2 border-dashed border-[#2D2A32]/15">
              <div class="text-xs font-bold text-[#2D2A32]/75">
                @if (hasPendingFilterChanges()) {
                  <span class="text-[#BE123C] font-extrabold">
                    ⚡ Bạn vừa đổi tiêu chí lọc — bấm "Áp dụng bộ lọc" để xem kết quả nhé!
                  </span>
                } @else {
                  <span>
                    ✅ Kết quả kỳ lọc từ <strong>{{ appliedStartDate() || 'đầu' }}</strong> đến <strong>{{ appliedEndDate() }}</strong>:
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="applyFilters()"
                class="toy-btn px-6 py-2.5 text-sm font-extrabold"
                [ngClass]="
                  hasPendingFilterChanges()
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-[#FFB020] text-[#2D2A32]'
                "
              >
                ✅ Áp dụng bộ lọc
              </button>
            </div>

            <!-- Khung Kết Quả Lọc (Tổng Thu kỳ lọc • Tổng Chi thực tế • Số dư ròng kỳ lọc) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#DCFCE7]/65 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold uppercase text-[#15803D]">
                    🌾 Tổng Thu kỳ lọc
                  </span>
                  <span class="text-lg">📈</span>
                </div>
                <div class="money-num font-extrabold text-xl sm:text-2xl text-[#15803D] mt-1 whitespace-nowrap">
                  {{ periodKpis().totalIncome | vnd: true : 'plus' }}
                </div>
                <div class="text-xs font-bold text-[#15803D] mt-1.5">
                  {{ periodKpis().incomeCount }} khoản thu
                </div>
              </div>

              <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#FFE4E6]/65 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold uppercase text-[#BE123C]">
                    🛒 Tổng Chi thực tế
                  </span>
                  <span class="text-lg">💸</span>
                </div>
                <div class="money-num font-extrabold text-xl sm:text-2xl text-[#BE123C] mt-1 whitespace-nowrap">
                  {{ periodKpis().netExpense | vnd: true : 'minus' }}
                </div>
                <div class="text-xs font-bold text-[#BE123C] mt-1.5">
                  {{ periodKpis().expenseCount }} khoản chi
                  @if (periodKpis().totalRefunded > 0) {
                    <span>(Đã hoàn: {{ periodKpis().totalRefunded | vnd }})</span>
                  }
                </div>
              </div>

              <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#FFF9EC] flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold uppercase text-[#2D2A32]/80">
                    ⚖️ Số dư ròng kỳ lọc
                  </span>
                  <span class="text-lg">🐷</span>
                </div>
                <div
                  class="money-num font-extrabold text-xl sm:text-2xl mt-1 whitespace-nowrap"
                  [ngClass]="
                    periodKpis().netCashflow >= 0 ? 'text-[#15803D]' : 'text-[#BE123C]'
                  "
                >
                  {{
                    periodKpis().netCashflow
                      | vnd: true : (periodKpis().netCashflow >= 0 ? 'plus' : 'none')
                  }}
                </div>
                <div class="text-xs font-bold text-[#2D2A32]/75 mt-1.5">
                  Tỉ lệ tiết kiệm:
                  <strong class="money-num">{{ periodKpis().savingsRate.toFixed(0) }}%</strong>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ======================================================================= -->
      <!-- 5. KHUNG BIỂU ĐỒ (RÚT GỌN CÒN ĐÚNG CHỮ "BIỂU ĐỒ", BẤM MỞ POPUP)         -->
      <!-- ======================================================================= -->
      <div
        (click)="openChartsModal()"
        class="toy-card-lg p-4 sm:p-5 bg-[#E0F2FE]/75 hover:bg-[#E0F2FE] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-2xl bg-[#38BDF8] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32] flex items-center justify-center text-xl shrink-0"
          >
            📊
          </div>
          <h3 class="font-display font-extrabold text-lg sm:text-xl text-[#2D2A32] whitespace-nowrap">
            Biểu đồ
          </h3>
        </div>

        <button
          type="button"
          class="toy-btn px-4 py-1.5 bg-[#38BDF8] text-[#2D2A32] text-xs font-extrabold shrink-0"
        >
          Mở 📈
        </button>
      </div>

      <!-- ======================================================================= -->
      <!-- 6. CHI TIẾT VÍ (1 DÒNG DUY NHẤT + NHÁY SÁNG + NÚT QUẢN LÝ VÍ)           -->
      <!-- ======================================================================= -->
      <div
        #walletDetailsSection
        class="toy-card p-5 bg-white transition-all"
        [class.animate-wallet-flash]="walletSectionFlashing()"
      >
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-2xl shrink-0">💳</span>
            <h3 class="font-display font-extrabold text-lg sm:text-xl text-[#2D2A32] whitespace-nowrap">
              Chi tiết ví
            </h3>
          </div>

          <button
            type="button"
            (click)="openWalletManagerPopup()"
            class="toy-btn px-3.5 py-1.5 bg-[#FFB020] hover:bg-[#FFA000] text-[#2D2A32] text-xs sm:text-sm font-extrabold shrink-0 whitespace-nowrap"
          >
            ⚙️ Quản lý ví
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          @for (w of walletService.activeWallets(); track w.id) {
            <div
              class="p-4 rounded-2xl border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] flex flex-col justify-between"
              [style.backgroundColor]="ownerMeta[w.owner_scope].badgeBg"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-display font-extrabold text-base text-[#2D2A32] truncate">
                  {{ walletTypeMeta[w.wallet_type].emoji }} {{ w.name }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white border border-[#2D2A32] shrink-0"
                >
                  {{ ownerMeta[w.owner_scope].emoji }} {{ ownerMeta[w.owner_scope].label }}
                </span>
              </div>
              <div class="money-num font-extrabold text-xl text-[#2D2A32] mt-2 whitespace-nowrap">
                {{ w.current_balance | vnd }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ======================================================================= -->
      <!-- POPUP 1: LỊCH SỬ GIAO DỊCH RIÊNG CHO THU HOẶC CHI                       -->
      <!-- ======================================================================= -->
      @if (txHistoryPopupOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D2A32]/65 backdrop-blur-xs overflow-y-auto"
          (click)="txHistoryPopupOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-2xl p-4 sm:p-6 bg-[#FFFDF5] my-auto max-h-[88dvh] flex flex-col justify-between"
            (click)="$event.stopPropagation()"
          >
            <!-- Popup Header -->
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">
                  {{ txHistoryPopupType() === 'INCOME' ? '🌾' : '🛒' }}
                </span>
                <div>
                  <h3 class="font-display font-extrabold text-lg sm:text-xl text-[#2D2A32]">
                    {{
                      txHistoryPopupType() === 'INCOME'
                        ? 'Lịch sử Khoản Thu'
                        : 'Lịch sử Khoản Chi'
                    }}
                    ({{ popupTransactions().length }})
                  </h3>
                </div>
              </div>
              <button
                type="button"
                (click)="txHistoryPopupOpen.set(false)"
                class="toy-btn px-3 py-1 bg-white text-xs font-extrabold"
              >
                ✕ Đóng
              </button>
            </div>

            <!-- List of Transactions -->
            <div class="my-4 space-y-2.5 overflow-y-auto pr-1 max-h-[62dvh]">
              @for (tx of popupTransactions(); track tx.id) {
                <div
                  class="toy-card p-3.5 bg-white flex items-center justify-between gap-3"
                  [class.opacity-60]="tx.status === 'RETURNED'"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span
                      class="w-10 h-10 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-center text-lg shrink-0"
                      [style.backgroundColor]="getCategoryColor(tx)"
                    >
                      {{ getCategoryIcon(tx) }}
                    </span>
                    <div class="min-w-0">
                      <div class="font-display font-extrabold text-sm sm:text-base text-[#2D2A32] truncate">
                        {{ tx.title }}
                      </div>
                      <div class="text-xs font-bold text-[#2D2A32]/70 truncate">
                        {{ tx.transaction_date }} • {{ getWalletLabel(tx.wallet_id) }}
                      </div>
                      @if (tx.status === 'RETURNED') {
                        <div class="text-[11px] font-extrabold text-[#0369A1]">
                          ↩️ Đã hoàn: {{ (tx.refunded_amount ?? tx.amount) | vnd }}
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-1 shrink-0">
                    <div
                      class="money-num font-extrabold text-base sm:text-lg whitespace-nowrap"
                      [ngClass]="
                        tx.type === 'INCOME' ? 'text-[#15803D]' : 'text-[#BE123C]'
                      "
                    >
                      {{
                        tx.amount
                          | vnd: true : (tx.type === 'INCOME' ? 'plus' : 'minus')
                      }}
                    </div>

                    @if (transactionService.getRunningBalanceAfter(tx.id) !== null) {
                      <div class="text-[11px] font-bold text-[#2D2A32]/50 money-num whitespace-nowrap">
                        Số dư: {{ transactionService.getRunningBalanceAfter(tx.id) | vnd }}
                      </div>
                    }

                    <div class="flex items-center gap-1">
                      @if (tx.type === 'EXPENSE' && tx.is_refundable && tx.status === 'DONE') {
                        <button
                          type="button"
                          (click)="openRefundFromPopup(tx)"
                          class="px-2 py-0.5 rounded-lg border border-[#2D2A32] bg-[#E0F2FE] text-[11px] font-extrabold cursor-pointer"
                        >
                          ↩️ Hoàn
                        </button>
                      }
                      @if (!tx.is_locked && tx.status !== 'RETURNED') {
                        <button
                          type="button"
                          (click)="openEditTxFromPopup(tx)"
                          class="px-2 py-0.5 rounded-lg border border-[#2D2A32] bg-[#FFF9EC] text-[11px] cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          (click)="deleteTxFromPopup(tx)"
                          class="px-2 py-0.5 rounded-lg border border-[#2D2A32] bg-[#FFE4E6] text-[11px] cursor-pointer"
                        >
                          🗑️
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center">
                  <div class="text-4xl mb-2">🐷💤</div>
                  <p class="font-display font-extrabold text-base text-[#2D2A32]">
                    Chưa có giao dịch {{ txHistoryPopupType() === 'INCOME' ? 'Thu' : 'Chi' }} nào trong kỳ này!
                  </p>
                </div>
              }
            </div>

            <div class="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#2D2A32]/15">
              <button
                type="button"
                (click)="txHistoryPopupOpen.set(false); dataSync.openQuickAdd(txHistoryPopupType())"
                class="toy-btn px-4 py-2 text-xs font-extrabold text-white"
                [ngClass]="
                  txHistoryPopupType() === 'INCOME'
                    ? 'bg-[#22C55E]'
                    : 'bg-[#FF5C6C]'
                "
              >
                {{
                  txHistoryPopupType() === 'INCOME'
                    ? '+ Thêm khoản Thu'
                    : '- Thêm khoản Chi'
                }}
              </button>

              <button
                type="button"
                (click)="txHistoryPopupOpen.set(false)"
                class="toy-btn px-5 py-2 bg-[#FFB020] text-[#2D2A32] text-xs font-extrabold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit / Refund Modals triggered from Dashboard History Popup -->
      <app-transaction-form-modal
        [isOpen]="editingTxModalOpen()"
        [defaultType]="editingTx()?.type || 'EXPENSE'"
        [editTransaction]="editingTx()"
        (closed)="editingTxModalOpen.set(false)"
      />

      <app-refund-modal
        [isOpen]="refundingTxModalOpen()"
        [transaction]="refundingTx()"
        (closed)="refundingTxModalOpen.set(false)"
      />

      <!-- ======================================================================= -->
      <!-- POPUP 2: BIỂU ĐỒ (2 TAB RIÊNG BIỆT, CỘT CAO CỐ ĐỊNH, BỎ % TIẾT KIỆM)   -->
      <!-- ======================================================================= -->
      @if (chartsModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D2A32]/65 backdrop-blur-xs overflow-y-auto"
          (click)="closeChartsModal()"
        >
          <div
            class="toy-card-lg w-full max-w-3xl p-4 sm:p-6 bg-[#FFFDF5] my-auto max-h-[92dvh] overflow-y-auto space-y-4"
            (click)="$event.stopPropagation(); dismissChartTooltips()"
          >
            <!-- Popup Header (Đồng nhất chữ "Biểu đồ") -->
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">📊</span>
                <h3 class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32]">
                  Biểu đồ
                </h3>
              </div>
              <button
                type="button"
                (click)="closeChartsModal()"
                class="toy-btn px-3.5 py-1.5 bg-white text-xs sm:text-sm font-extrabold"
              >
                ✕ Đóng
              </button>
            </div>

            <!-- 2 Tabs Switcher (Loại biểu đồ) -->
            <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#FFF9EC] border-2 border-[#2D2A32]">
              <button
                type="button"
                (click)="switchChartTab('BAR'); $event.stopPropagation()"
                class="py-2.5 px-3 rounded-xl font-display font-extrabold text-xs sm:text-sm cursor-pointer transition-all"
                [ngClass]="
                  chartTab() === 'BAR'
                    ? 'bg-[#FFB020] text-[#2D2A32] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                    : 'text-[#2D2A32]/70 hover:text-[#2D2A32]'
                "
              >
                📊 Thu - Chi
              </button>
              <button
                type="button"
                (click)="switchChartTab('DONUT'); $event.stopPropagation()"
                class="py-2.5 px-3 rounded-xl font-display font-extrabold text-xs sm:text-sm cursor-pointer transition-all"
                [ngClass]="
                  chartTab() === 'DONUT'
                    ? 'bg-[#FF8FAB] text-[#2D2A32] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                    : 'text-[#2D2A32]/70 hover:text-[#2D2A32]'
                "
              >
                🍩 Cơ cấu Chi tiêu
              </button>
            </div>

            <!-- Inline Time Granularity Selector: Theo Tháng • Theo Tuần • Tùy chọn ngày -->
            <div
              class="space-y-2.5"
              (click)="$event.stopPropagation()"
            >
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="setChartTimeMode('MONTH')"
                  class="py-2 px-2 rounded-xl border-2 border-[#2D2A32] font-display font-extrabold text-xs cursor-pointer transition-all whitespace-nowrap"
                  [ngClass]="
                    chartTimeMode() === 'MONTH'
                      ? 'bg-[#38BDF8] text-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                      : 'bg-white text-[#2D2A32]/75 hover:bg-[#FFF9EC]'
                  "
                >
                  📅 Theo Tháng
                </button>
                <button
                  type="button"
                  (click)="setChartTimeMode('WEEK')"
                  class="py-2 px-2 rounded-xl border-2 border-[#2D2A32] font-display font-extrabold text-xs cursor-pointer transition-all whitespace-nowrap"
                  [ngClass]="
                    chartTimeMode() === 'WEEK'
                      ? 'bg-[#38BDF8] text-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                      : 'bg-white text-[#2D2A32]/75 hover:bg-[#FFF9EC]'
                  "
                >
                  📆 Theo Tuần
                </button>
                <button
                  type="button"
                  (click)="setChartTimeMode('CUSTOM')"
                  class="py-2 px-2 rounded-xl border-2 border-[#2D2A32] font-display font-extrabold text-xs cursor-pointer transition-all whitespace-nowrap"
                  [ngClass]="
                    chartTimeMode() === 'CUSTOM'
                      ? 'bg-[#38BDF8] text-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                      : 'bg-white text-[#2D2A32]/75 hover:bg-[#FFF9EC]'
                  "
                >
                  🎯 Tùy chọn
                </button>
              </div>

              @if (chartTimeMode() === 'CUSTOM') {
                <div class="p-3 rounded-2xl bg-white border-2 border-[#2D2A32] grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                  <div class="sm:col-span-2">
                    <label class="block text-[10px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      [ngModel]="chartCustomStart()"
                      (ngModelChange)="chartCustomStart.set($event); refreshChartForTimeMode()"
                      class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-[10px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      [ngModel]="chartCustomEnd()"
                      (ngModelChange)="chartCustomEnd.set($event); refreshChartForTimeMode()"
                      class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
                    />
                  </div>
                  <button
                    type="button"
                    (click)="refreshChartForTimeMode()"
                    class="col-span-2 sm:col-span-1 toy-btn py-2 px-3 bg-[#FFB020] text-[#2D2A32] text-xs font-extrabold"
                  >
                    Xem 📈
                  </button>
                </div>
              }
            </div>

            <!-- TAB 1: Biểu đồ Cột Thu - Chi (Chiều cao cố định h-80 sm:h-96, bỏ % tiết kiệm) -->
            @if (chartTab() === 'BAR') {
              <div class="toy-card p-4 sm:p-5 bg-white flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-display font-extrabold text-sm sm:text-base text-[#2D2A32]">
                    Cột xanh: Thu • Cột đỏ: Chi
                  </span>
                  <button
                    type="button"
                    (click)="dismissChartTooltips(); $event.stopPropagation()"
                    class="px-2.5 py-1 rounded-xl border border-[#2D2A32] bg-[#FFF9EC] text-[11px] font-extrabold cursor-pointer"
                  >
                    Ẩn số liệu
                  </button>
                </div>

                <!-- Fixed Tall Height Container -->
                <div
                  class="relative h-80 sm:h-96 w-full"
                  (click)="$event.stopPropagation()"
                >
                  <canvas #cashflowCanvas></canvas>
                </div>
              </div>
            }

            <!-- TAB 2: Biểu đồ Donut Cơ cấu Chi tiêu -->
            @if (chartTab() === 'DONUT') {
              <div class="toy-card p-4 sm:p-5 bg-white flex flex-col">
                <div
                  class="relative h-72 sm:h-80 w-full flex items-center justify-center"
                  (click)="$event.stopPropagation()"
                >
                  <canvas #donutCanvas></canvas>
                  @if (expenseByCategory().length === 0) {
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/90">
                      <span class="text-4xl mb-2">🍩💤</span>
                      <p class="font-display font-extrabold text-sm text-[#2D2A32]">
                        Chưa có khoản chi nào trong kỳ lọc này!
                      </p>
                    </div>
                  }
                </div>

                @if (expenseByCategory().length > 0) {
                  <div class="mt-4 space-y-2 max-h-44 overflow-y-auto pr-1 pt-3 border-t-2 border-dashed border-[#2D2A32]/15">
                    @for (cat of expenseByCategory(); track cat.categoryId) {
                      <div class="flex items-center justify-between text-xs font-bold">
                        <div class="flex items-center gap-2 min-w-0">
                          <span
                            class="w-3.5 h-3.5 rounded-full border border-[#2D2A32] shrink-0"
                            [style.backgroundColor]="cat.color"
                          ></span>
                          <span class="truncate">{{ cat.icon }} {{ cat.name }}</span>
                        </div>
                        <div class="money-num font-extrabold text-[#2D2A32] shrink-0">
                          {{ cat.amount | vnd }} ({{ cat.percent.toFixed(0) }}%)
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================================= -->
      <!-- POPUP 3: QUẢN LÝ VÍ & NGUỒN TIỀN                                        -->
      <!-- ======================================================================= -->
      @if (walletManagerPopupOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D2A32]/65 backdrop-blur-xs overflow-y-auto"
          (click)="walletManagerPopupOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-5xl p-4 sm:p-6 bg-[#FFFDF5] my-auto max-h-[92dvh] overflow-y-auto space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="toy-card p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32]">
                  💳 Quản lý Ví & Nguồn tiền
                </h2>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  (click)="openWalletFormModal()"
                  class="toy-btn px-4 py-2 bg-[#22C55E] text-white text-xs sm:text-sm font-extrabold"
                >
                  + Thêm ví mới
                </button>
                <button
                  type="button"
                  (click)="walletManagerPopupOpen.set(false)"
                  class="toy-btn px-3 py-2 bg-white text-xs sm:text-sm font-extrabold"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            <div class="toy-card p-3.5 bg-[#FFF9EC] flex flex-wrap items-center gap-2">
              <span class="text-xs font-extrabold text-[#2D2A32]/75">⚡ Tạo nhanh:</span>
              @for (preset of walletPresets; track preset.name) {
                <button
                  type="button"
                  (click)="openWalletPreset(preset)"
                  class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] bg-white hover:bg-[#FEF3C7] font-display font-bold text-xs cursor-pointer"
                >
                  {{ preset.emoji }} {{ preset.name }}
                </button>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (w of walletService.walletsWithBalance(); track w.id) {
                <div
                  class="toy-card p-5 bg-white flex flex-col justify-between space-y-4"
                  [class.opacity-60]="w.is_archived"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-12 h-12 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-center text-2xl shrink-0"
                        [style.backgroundColor]="ownerMeta[w.owner_scope].badgeBg"
                      >
                        {{ walletTypeMeta[w.wallet_type].emoji }}
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                            {{ w.name }}
                          </h3>
                          @if (w.is_archived) {
                            <span class="px-2 py-0.5 rounded-full bg-gray-200 border border-[#2D2A32] text-[10px] font-extrabold">
                              Đã ẩn
                            </span>
                          }
                        </div>
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-[#2D2A32] mt-0.5"
                          [style.backgroundColor]="ownerMeta[w.owner_scope].badgeBg"
                        >
                          {{ ownerMeta[w.owner_scope].emoji }} {{ ownerMeta[w.owner_scope].label }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="p-3 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2A32] space-y-1">
                    <div class="flex items-center justify-between text-xs font-bold text-[#2D2A32]/70">
                      <span>Số dư đầu kỳ:</span>
                      <span class="money-num">{{ w.initial_balance | vnd }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-extrabold text-[#2D2A32]">Số dư thực tế:</span>
                      <span class="money-num font-extrabold text-xl text-[#15803D]">
                        {{ w.current_balance | vnd }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      (click)="openWalletFormModal(w)"
                      class="toy-btn px-3 py-1.5 bg-[#FFF9EC] text-xs font-extrabold"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      type="button"
                      (click)="toggleArchiveWallet(w)"
                      class="toy-btn px-3 py-1.5 bg-[#E0F2FE] text-xs font-extrabold"
                    >
                      {{ w.is_archived ? '👁️ Hiện lại' : '📦 Ẩn' }}
                    </button>
                    <button
                      type="button"
                      (click)="onDeleteWallet(w)"
                      class="toy-btn px-3 py-1.5 bg-[#FFE4E6] text-xs font-extrabold"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- NESTED MODAL: CREATE / EDIT WALLET -->
      @if (walletFormModalOpen()) {
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2A32]/65 backdrop-blur-xs"
          (click)="walletFormModalOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                {{ editingWallet() ? '✏️ Sửa thông tin Ví' : '💳 Thêm Ví mới' }}
              </h3>
              <button
                type="button"
                (click)="walletFormModalOpen.set(false)"
                class="toy-btn px-2.5 py-1 bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="onSaveWallet()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Tên Ví / Ngân hàng *
                </label>
                <input
                  type="text"
                  name="walletName"
                  [ngModel]="walletName()"
                  (ngModelChange)="walletName.set($event)"
                  placeholder="VD: TPBank Vợ, VietinBank Chồng..."
                  required
                  class="toy-input bg-white"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Chủ sở hữu *
                  </label>
                  <select
                    name="walletOwner"
                    [ngModel]="walletOwner()"
                    (ngModelChange)="walletOwner.set($event)"
                    class="toy-input bg-white"
                  >
                    <option value="WIFE">🐱 Vợ yêu</option>
                    <option value="HUSBAND">🐶 Chồng yêu</option>
                    <option value="SHARED">🐷 Quỹ chung</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Loại nguồn tiền *
                  </label>
                  <select
                    name="walletType"
                    [ngModel]="walletType()"
                    (ngModelChange)="walletType.set($event)"
                    class="toy-input bg-white"
                  >
                    <option value="BANK">🏦 Ngân hàng</option>
                    <option value="CASH">💵 Tiền mặt</option>
                    <option value="EWALLET">📱 Ví điện tử</option>
                    <option value="OTHER">🪙 Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Số dư đầu kỳ (VND)
                </label>
                <div class="relative">
                  <input
                    type="text"
                    inputmode="numeric"
                    name="walletInitialDisplay"
                    [ngModel]="walletInitialDisplay()"
                    (ngModelChange)="onWalletInitialInput($event)"
                    placeholder="0"
                    class="toy-input money-num text-xl font-extrabold bg-white pr-24"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    @if (walletInitialDisplay() && walletInitialDisplay() !== '0') {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="clearWalletInitial()"
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
                @if (walletInitialSuggestions().length > 0) {
                  <div class="grid grid-cols-3 gap-2 mt-2">
                    @for (sug of walletInitialSuggestions(); track sug.raw) {
                      <button
                        type="button"
                        (mousedown)="$event.preventDefault()"
                        (click)="applyWalletInitialSuggestion(sug.display)"
                        class="py-1.5 px-2 text-xs font-extrabold rounded-xl border-2 border-[#2D2A32] bg-[#FEF3C7] hover:bg-[#FFB020] text-[#2D2A32] shadow-[0_2px_0_#2D2A32] active:translate-y-0.5 cursor-pointer money-num text-center truncate transition-colors"
                      >
                        {{ sug.display }} ₫
                      </button>
                    }
                  </div>
                }
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="walletFormModalOpen.set(false)"
                  class="toy-btn px-4 py-2 bg-white text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  [disabled]="submittingWallet()"
                  class="toy-btn px-5 py-2 bg-[#22C55E] text-white text-sm font-extrabold"
                >
                  {{ submittingWallet() ? '⏳ Đang lưu...' : '💾 Lưu Ví' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnDestroy {
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  readonly transactionService = inject(TransactionService);
  readonly debtLoanService = inject(DebtLoanService);
  readonly dataSync = inject(DataSyncService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('cashflowCanvas') cashflowCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('walletDetailsSection') walletDetailsSection?: ElementRef<HTMLElement>;

  readonly ownerMeta = OWNER_SCOPE_META;
  readonly walletTypeMeta = WALLET_TYPE_META;

  readonly walletPresets: {
    name: string;
    type: WalletType;
    scope: OwnerScope;
    emoji: string;
  }[] = [
    { name: 'TPBank', type: 'BANK', scope: 'WIFE', emoji: '🟣' },
    { name: 'VietinBank', type: 'BANK', scope: 'HUSBAND', emoji: '🔵' },
    { name: 'BIDV', type: 'BANK', scope: 'SHARED', emoji: '🏦' },
    { name: 'Tiền mặt', type: 'CASH', scope: 'SHARED', emoji: '💵' },
    { name: 'Ví MoMo', type: 'EWALLET', scope: 'WIFE', emoji: '📱' },
  ];

  // Scroll + 1.6s Temporary Flash Highlight State
  readonly walletSectionFlashing = signal<boolean>(false);
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;

  // Collapsible Filter Bar State (Default CLOSED)
  readonly filterOpen = signal<boolean>(false);

  // Thu / Chi History Popup State
  readonly txHistoryPopupOpen = signal<boolean>(false);
  readonly txHistoryPopupType = signal<'INCOME' | 'EXPENSE'>('EXPENSE');
  readonly editingTxModalOpen = signal<boolean>(false);
  readonly editingTx = signal<Transaction | null>(null);
  readonly refundingTxModalOpen = signal<boolean>(false);
  readonly refundingTx = signal<Transaction | null>(null);

  // Wallet Manager Popup & Nested Form State
  readonly walletManagerPopupOpen = signal<boolean>(false);
  readonly walletFormModalOpen = signal<boolean>(false);
  readonly editingWallet = signal<WalletWithBalance | null>(null);
  readonly walletName = signal<string>('');
  readonly walletOwner = signal<OwnerScope>('SHARED');
  readonly walletType = signal<WalletType>('BANK');
  readonly walletInitialDisplay = signal<string>('');
  readonly showWalletInitialSuggestions = signal<boolean>(true);
  readonly submittingWallet = signal<boolean>(false);

  readonly walletInitialSuggestions = computed(() => {
    if (!this.showWalletInitialSuggestions()) return [];
    return getMoneySuggestions(this.walletInitialDisplay());
  });

  // Draft Filter Controls
  readonly draftRangePreset = signal<'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('ALL_TIME');
  readonly draftType = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly draftWalletId = signal<string>('ALL');
  readonly draftCategoryId = signal<string>('ALL');
  readonly draftStartDate = signal<string>('');
  readonly draftEndDate = signal<string>(this.todayIso());

  // Applied Filter State
  readonly appliedType = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly appliedWalletId = signal<string>('ALL');
  readonly appliedCategoryId = signal<string>('ALL');
  readonly appliedStartDate = signal<string>('');
  readonly appliedEndDate = signal<string>(this.todayIso());

  // Charts Popup Modal State, Active Tab ('BAR' | 'DONUT') & Time Mode ('MONTH' | 'WEEK' | 'CUSTOM')
  readonly chartsModalOpen = signal<boolean>(false);
  readonly chartTab = signal<'BAR' | 'DONUT'>('BAR');
  readonly chartTimeMode = signal<'MONTH' | 'WEEK' | 'CUSTOM'>('MONTH');
  readonly chartCustomStart = signal<string>('');
  readonly chartCustomEnd = signal<string>(this.todayIso());

  private cashflowChart: Chart | null = null;
  private donutChart: Chart | null = null;
  private initializedEarliest = false;

  constructor() {
    effect(() => {
      const earliest = this.transactionService.earliestTransactionDate();
      if (!this.initializedEarliest && earliest) {
        this.initializedEarliest = true;
        this.draftStartDate.set(earliest);
        this.appliedStartDate.set(earliest);
      }
    });
  }

  // --- Thu / Chi Dedicated History Popup Methods ---
  openTxHistoryPopup(type: 'INCOME' | 'EXPENSE'): void {
    this.txHistoryPopupType.set(type);
    this.txHistoryPopupOpen.set(true);
  }

  readonly popupTransactions = computed(() => {
    const targetType = this.txHistoryPopupType();
    return this.filteredTransactions().filter((tx) => tx.type === targetType);
  });

  getWalletLabel(walletId: string | null): string {
    if (!walletId) return '---';
    const w = this.walletService.getWalletById(walletId);
    if (!w) return 'Ví';
    return `${this.ownerMeta[w.owner_scope].emoji} ${w.name}`;
  }

  getCategoryIcon(tx: Transaction): string {
    return (
      this.categoryService.getCategoryById(tx.category_id)?.icon ??
      (tx.type === 'INCOME' ? '🌾' : '🛒')
    );
  }

  getCategoryColor(tx: Transaction): string {
    return (
      this.categoryService.getCategoryById(tx.category_id)?.color ??
      (tx.type === 'INCOME' ? '#DCFCE7' : '#FFE4E6')
    );
  }

  openEditTxFromPopup(tx: Transaction): void {
    if (tx.is_locked || tx.status === 'RETURNED') return;
    this.editingTx.set(tx);
    this.editingTxModalOpen.set(true);
  }

  openRefundFromPopup(tx: Transaction): void {
    if (tx.type !== 'EXPENSE' || !tx.is_refundable || tx.status !== 'DONE') return;
    this.refundingTx.set(tx);
    this.refundingTxModalOpen.set(true);
  }

  async deleteTxFromPopup(tx: Transaction): Promise<void> {
    if (tx.is_locked) return;
    if (!confirm(`Xóa giao dịch "${tx.title}"?`)) return;
    try {
      await this.transactionService.softDeleteTransaction(tx.id);
      this.toast.show('info', 'Đã xóa giao dịch! 🗑️', `Đã xóa "${tx.title}".`);
    } catch (err: any) {
      this.toast.show('error', 'Không thể xóa! 🚨', err?.message || 'Có lỗi xảy ra.');
    }
  }

  // --- Scroll to Wallet Details ---
  scrollToWalletDetails(): void {
    const el = this.walletDetailsSection?.nativeElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }
    this.walletSectionFlashing.set(false);
    setTimeout(() => {
      this.walletSectionFlashing.set(true);
      this.flashTimeout = setTimeout(() => {
        this.walletSectionFlashing.set(false);
      }, 1650);
    }, 50);
  }

  // --- Wallet Manager Popup Methods ---
  openWalletManagerPopup(): void {
    this.walletManagerPopupOpen.set(true);
  }

  formatVnd(val: string): string {
    return formatVndInput(val);
  }

  onWalletInitialInput(val: string): void {
    this.showWalletInitialSuggestions.set(true);
    this.walletInitialDisplay.set(formatVndInput(val));
  }

  applyWalletInitialSuggestion(display: string): void {
    this.walletInitialDisplay.set(display);
    this.showWalletInitialSuggestions.set(false);
  }

  clearWalletInitial(): void {
    this.walletInitialDisplay.set('');
    this.showWalletInitialSuggestions.set(true);
  }

  openWalletFormModal(w?: WalletWithBalance): void {
    this.submittingWallet.set(false);
    if (w) {
      this.editingWallet.set(w);
      this.walletName.set(w.name);
      this.walletOwner.set(w.owner_scope);
      this.walletType.set(w.wallet_type);
      this.walletInitialDisplay.set(formatVndInput(w.initial_balance));
    } else {
      this.editingWallet.set(null);
      this.walletName.set('');
      this.walletOwner.set('SHARED');
      this.walletType.set('BANK');
      this.walletInitialDisplay.set('0');
    }
    this.walletFormModalOpen.set(true);
  }

  openWalletPreset(preset: {
    name: string;
    type: WalletType;
    scope: OwnerScope;
  }): void {
    this.submittingWallet.set(false);
    this.editingWallet.set(null);
    this.walletName.set(preset.name);
    this.walletType.set(preset.type);
    this.walletOwner.set(preset.scope);
    this.walletInitialDisplay.set('0');
    this.walletFormModalOpen.set(true);
  }

  async onSaveWallet(): Promise<void> {
    if (this.submittingWallet()) return;
    if (!this.walletName().trim()) {
      this.toast.show('warning', 'Thiếu tên ví! 💳', 'Hãy nhập tên ví hoặc ngân hàng.');
      return;
    }

    this.submittingWallet.set(true);
    try {
      const initial = parseVndInput(this.walletInitialDisplay());
      const edit = this.editingWallet();
      const savedName = this.walletName();
      if (edit) {
        await this.walletService.updateWallet(edit.id, {
          name: savedName,
          owner_scope: this.walletOwner(),
          wallet_type: this.walletType(),
          initial_balance: initial,
        });
      } else {
        await this.walletService.createWallet({
          name: savedName,
          owner_scope: this.walletOwner(),
          wallet_type: this.walletType(),
          initial_balance: initial,
        });
      }
      this.walletFormModalOpen.set(false);
      this.cdr.detectChanges();
      this.toast.show(
        'success',
        edit ? 'Đã cập nhật ví! ✨' : 'Đã thêm ví mới! 💳',
        edit ? 'Thông tin ví đã được lưu.' : `Ví "${savedName}" đã sẵn sàng.`
      );
    } catch (err: any) {
      this.toast.show('error', 'Không thể lưu ví! 🚨', err?.message || 'Vui lòng thử lại.');
    } finally {
      this.submittingWallet.set(false);
      this.cdr.detectChanges();
    }
  }

  async toggleArchiveWallet(w: Wallet): Promise<void> {
    try {
      await this.walletService.updateWallet(w.id, {
        is_archived: !w.is_archived,
      });
      this.toast.show(
        'info',
        w.is_archived ? 'Đã mở lại ví! 👁️' : 'Đã ẩn (lưu trữ) ví! 📦',
        `Ví "${w.name}" đã được cập nhật trạng thái.`
      );
    } catch (err: any) {
      this.toast.show('error', 'Lỗi cập nhật! 🚨', err?.message || 'Vui lòng thử lại.');
    }
  }

  async onDeleteWallet(w: Wallet): Promise<void> {
    if (!confirm(`Bạn có chắc muốn xóa ví "${w.name}" không?`)) return;
    try {
      await this.walletService.deleteWallet(w.id);
      this.toast.show('info', 'Đã xóa ví! 🗑️', `Ví "${w.name}" đã được xóa.`);
    } catch (err: any) {
      this.toast.show(
        'warning',
        'Không thể xóa ví này! 🛡️',
        err?.message ||
          'Không thể xóa vì đã có giao dịch gắn với mục này. Bạn có thể chọn Ẩn (Lưu trữ) thay thế.',
        7000
      );
    }
  }

  // --- Filter & Chart Methods ---
  readonly hasPendingFilterChanges = computed(() => {
    return (
      this.draftType() !== this.appliedType() ||
      this.draftWalletId() !== this.appliedWalletId() ||
      this.draftCategoryId() !== this.appliedCategoryId() ||
      this.draftStartDate() !== this.appliedStartDate() ||
      this.draftEndDate() !== this.appliedEndDate()
    );
  });

  applyFilters(): void {
    this.appliedType.set(this.draftType());
    this.appliedWalletId.set(this.draftWalletId());
    this.appliedCategoryId.set(this.draftCategoryId());
    this.appliedStartDate.set(this.draftStartDate());
    this.appliedEndDate.set(this.draftEndDate());

    if (this.chartsModalOpen()) {
      setTimeout(() => this.renderActiveTabChart(), 50);
    }
  }

  setThisMonthDraft(): void {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-01`;
    this.draftRangePreset.set('THIS_MONTH');
    this.draftStartDate.set(start);
    this.draftEndDate.set(this.todayIso());
  }

  setAllTimeDraft(): void {
    this.draftRangePreset.set('ALL_TIME');
    this.draftStartDate.set(this.transactionService.earliestTransactionDate());
    this.draftEndDate.set(this.todayIso());
  }

  onDraftDateChange(which: 'start' | 'end', val: string): void {
    this.draftRangePreset.set('CUSTOM');
    if (which === 'start') {
      this.draftStartDate.set(val);
    } else {
      this.draftEndDate.set(val);
    }
  }

  resetAndApplyFilters(): void {
    this.draftType.set('ALL');
    this.draftWalletId.set('ALL');
    this.draftCategoryId.set('ALL');
    this.draftRangePreset.set('ALL_TIME');
    this.draftStartDate.set(this.transactionService.earliestTransactionDate());
    this.draftEndDate.set(this.todayIso());
    this.applyFilters();
  }

  readonly filteredTransactions = computed(() => {
    const list = this.transactionService.transactions();
    const fType = this.appliedType();
    const fWallet = this.appliedWalletId();
    const fCat = this.appliedCategoryId();
    const start = this.appliedStartDate();
    const end = this.appliedEndDate();

    return list.filter((tx) => {
      if (fType !== 'ALL' && tx.type !== fType) return false;
      if (
        fWallet !== 'ALL' &&
        tx.wallet_id !== fWallet &&
        tx.to_wallet_id !== fWallet
      ) {
        return false;
      }
      if (fCat !== 'ALL' && tx.category_id !== fCat) return false;
      if (start && tx.transaction_date < start) return false;
      if (end && tx.transaction_date > end) return false;
      return true;
    });
  });

  readonly periodKpis = computed(() => {
    const txs = this.filteredTransactions();
    const today = this.todayIso();
    let totalIncome = 0;
    let grossExpense = 0;
    let totalRefunded = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let todayExpenseCount = 0;
    let todayNetExpense = 0;

    for (const tx of txs) {
      if (tx.type === 'INCOME') {
        totalIncome += Number(tx.amount || 0);
        incomeCount++;
      } else if (tx.type === 'EXPENSE') {
        const amt = Number(tx.amount || 0);
        const ref =
          tx.status === 'RETURNED' ? Number(tx.refunded_amount ?? amt) : 0;
        const net = Math.max(0, amt - ref);
        grossExpense += amt;
        totalRefunded += ref;
        expenseCount++;

        if (tx.transaction_date === today && net > 0) {
          todayExpenseCount++;
          todayNetExpense += net;
        }
      }
    }

    const netExpense = Math.max(0, grossExpense - totalRefunded);
    const netCashflow = totalIncome - netExpense;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - netExpense) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      grossExpense,
      totalRefunded,
      netExpense,
      netCashflow,
      savingsRate,
      incomeCount,
      expenseCount,
      totalTxCount: incomeCount + expenseCount,
      todayExpenseCount,
      todayNetExpense,
    };
  });

  readonly piggyMood = computed<PiggyMood>(() => {
    const kpi = this.periodKpis();
    if (kpi.totalTxCount === 0) return 'SLEEPY';
    if (kpi.netExpense > kpi.totalIncome) return 'BROKE';
    if (kpi.todayExpenseCount >= 2 || kpi.todayNetExpense >= 300_000) {
      return 'SHOPPING_SPREE';
    }
    if (kpi.savingsRate >= 30) return 'RICH';
    if (kpi.savingsRate >= 10) return 'CHILL';
    return 'TIGHT';
  });

  /** Transactions scoped specifically for the Chart Popup based on chartTimeMode() */
  readonly chartScopedTransactions = computed(() => {
    const baseList = this.filteredTransactions();
    const mode = this.chartTimeMode();

    if (mode === 'CUSTOM') {
      const s = this.chartCustomStart();
      const e = this.chartCustomEnd();
      return baseList.filter((tx) => {
        if (s && tx.transaction_date < s) return false;
        if (e && tx.transaction_date > e) return false;
        return true;
      });
    }

    if (mode === 'WEEK') {
      // Focus on the current month (or latest month present in filtered data) broken down by 4 weeks
      const targetMonth = this.latestActiveMonthPrefix();
      return baseList.filter((tx) => tx.transaction_date.startsWith(targetMonth));
    }

    return baseList;
  });

  private readonly latestActiveMonthPrefix = computed(() => {
    const list = this.filteredTransactions();
    if (list.length === 0) return this.todayIso().slice(0, 7);
    let maxMonth = list[0].transaction_date.slice(0, 7);
    for (const tx of list) {
      const m = tx.transaction_date.slice(0, 7);
      if (m > maxMonth) maxMonth = m;
    }
    return maxMonth;
  });

  readonly expenseByCategory = computed(() => {
    const txs = this.chartScopedTransactions().filter((t) => t.type === 'EXPENSE');
    const cats = this.categoryService.categories();
    const catMap = new Map(cats.map((c) => [c.id, c]));

    const totals = new Map<
      string,
      { categoryId: string; name: string; icon: string; color: string; amount: number }
    >();

    let grandTotal = 0;
    for (const tx of txs) {
      const refunded =
        tx.status === 'RETURNED'
          ? Number(tx.refunded_amount ?? tx.amount)
          : 0;
      const netAmt = Math.max(0, Number(tx.amount || 0) - refunded);
      if (netAmt <= 0) continue;

      const cId = tx.category_id || 'uncategorized';
      const cat = catMap.get(cId);
      const current = totals.get(cId) ?? {
        categoryId: cId,
        name: cat?.name ?? 'Khác',
        icon: cat?.icon ?? '🛍️',
        color: cat?.color ?? '#FF8FAB',
        amount: 0,
      };
      current.amount += netAmt;
      totals.set(cId, current);
      grandTotal += netAmt;
    }

    return Array.from(totals.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        percent: grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0,
      }));
  });

  readonly monthlyChartSeries = computed(() => {
    const mode = this.chartTimeMode();
    const txs = this.chartScopedTransactions();

    // MODE 1: BY WEEK (4 weeks of the target month: Tuần 1..Tuần 4)
    if (mode === 'WEEK') {
      const targetMonth = this.latestActiveMonthPrefix();
      const [, mm] = targetMonth.split('-');
      const labels = [
        `Tuần 1 (1-7/${mm})`,
        `Tuần 2 (8-14/${mm})`,
        `Tuần 3 (15-21/${mm})`,
        `Tuần 4 (22+/${mm})`,
      ];
      const incomes = [0, 0, 0, 0];
      const expenses = [0, 0, 0, 0];

      for (const tx of txs) {
        if (tx.type === 'TRANSFER') continue;
        const day = parseInt(tx.transaction_date.slice(8, 10), 10) || 1;
        const wIdx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        if (tx.type === 'INCOME') {
          incomes[wIdx] += Number(tx.amount || 0);
        } else if (tx.type === 'EXPENSE') {
          const refunded =
            tx.status === 'RETURNED'
              ? Number(tx.refunded_amount ?? tx.amount)
              : 0;
          expenses[wIdx] += Math.max(0, Number(tx.amount || 0) - refunded);
        }
      }
      return { labels, incomes, expenses };
    }

    // MODE 2: CUSTOM DATE RANGE (Group by day if <= 31 days, else by month)
    if (mode === 'CUSTOM') {
      const s = this.chartCustomStart();
      const e = this.chartCustomEnd();
      const diffDays =
        s && e
          ? Math.round(
              (new Date(e).getTime() - new Date(s).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 30;

      if (diffDays >= 0 && diffDays <= 31) {
        const dayMap = new Map<string, { income: number; expense: number }>();
        for (const tx of txs) {
          if (tx.type === 'TRANSFER') continue;
          const dKey = tx.transaction_date;
          const cur = dayMap.get(dKey) ?? { income: 0, expense: 0 };
          if (tx.type === 'INCOME') {
            cur.income += Number(tx.amount || 0);
          } else if (tx.type === 'EXPENSE') {
            const refunded =
              tx.status === 'RETURNED'
                ? Number(tx.refunded_amount ?? tx.amount)
                : 0;
            cur.expense += Math.max(0, Number(tx.amount || 0) - refunded);
          }
          dayMap.set(dKey, cur);
        }

        if (dayMap.size === 0) {
          const fallbackDay = e || this.todayIso();
          dayMap.set(fallbackDay, { income: 0, expense: 0 });
        }

        const sortedDays = Array.from(dayMap.keys()).sort();
        const labels = sortedDays.map((d) => {
          const [, m, day] = d.split('-');
          return `${day}/${m}`;
        });
        const incomes = sortedDays.map((d) => dayMap.get(d)!.income);
        const expenses = sortedDays.map((d) => dayMap.get(d)!.expense);
        return { labels, incomes, expenses };
      }
    }

    // MODE 3 (Default): BY MONTH
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const tx of txs) {
      if (tx.type === 'TRANSFER') continue;
      const mKey = tx.transaction_date.slice(0, 7);
      const cur = monthMap.get(mKey) ?? { income: 0, expense: 0 };
      if (tx.type === 'INCOME') {
        cur.income += Number(tx.amount || 0);
      } else if (tx.type === 'EXPENSE') {
        const refunded =
          tx.status === 'RETURNED'
            ? Number(tx.refunded_amount ?? tx.amount)
            : 0;
        cur.expense += Math.max(0, Number(tx.amount || 0) - refunded);
      }
      monthMap.set(mKey, cur);
    }

    if (monthMap.size === 0) {
      const nowKey = this.todayIso().slice(0, 7);
      monthMap.set(nowKey, { income: 0, expense: 0 });
    }

    const sortedKeys = Array.from(monthMap.keys()).sort();
    const labels: string[] = [];
    const incomes: number[] = [];
    const expenses: number[] = [];

    for (const k of sortedKeys) {
      const [yyyy, mm] = k.split('-');
      labels.push(`T${mm}/${yyyy}`);
      const val = monthMap.get(k)!;
      incomes.push(val.income);
      expenses.push(val.expense);
    }

    return { labels, incomes, expenses };
  });

  openChartsModal(): void {
    if (!this.chartCustomStart()) {
      const now = new Date();
      this.chartCustomStart.set(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      );
      this.chartCustomEnd.set(this.todayIso());
    }
    this.chartsModalOpen.set(true);
    this.chartTab.set('BAR');
    setTimeout(() => {
      this.renderActiveTabChart();
    }, 60);
  }

  setChartTimeMode(mode: 'MONTH' | 'WEEK' | 'CUSTOM'): void {
    this.chartTimeMode.set(mode);
    if (mode === 'CUSTOM' && !this.chartCustomStart()) {
      const now = new Date();
      this.chartCustomStart.set(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      );
      this.chartCustomEnd.set(this.todayIso());
    }
    this.refreshChartForTimeMode();
  }

  refreshChartForTimeMode(): void {
    this.destroyCharts();
    setTimeout(() => {
      this.renderActiveTabChart();
    }, 50);
  }

  switchChartTab(tab: 'BAR' | 'DONUT'): void {
    this.chartTab.set(tab);
    this.destroyCharts();
    setTimeout(() => {
      this.renderActiveTabChart();
    }, 50);
  }

  closeChartsModal(): void {
    this.destroyCharts();
    this.chartsModalOpen.set(false);
  }

  dismissChartTooltips(): void {
    for (const c of [this.cashflowChart, this.donutChart]) {
      if (c) {
        c.setActiveElements([]);
        c.tooltip?.setActiveElements([], { x: 0, y: 0 });
        c.update();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.cashflowChart?.destroy();
    this.cashflowChart = null;
    this.donutChart?.destroy();
    this.donutChart = null;
  }

  private renderActiveTabChart(): void {
    if (this.chartTab() === 'BAR') {
      this.renderCashflowChart();
    } else {
      this.renderDonutChart();
    }
  }

  private renderCashflowChart(): void {
    const canvas = this.cashflowCanvas?.nativeElement;
    if (!canvas) return;
    const series = this.monthlyChartSeries();

    this.cashflowChart?.destroy();
    this.cashflowChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Tổng Thu (VND)',
            data: series.incomes,
            backgroundColor: '#22C55E',
            borderColor: '#2D2A32',
            borderWidth: 2,
            borderRadius: 12,
            maxBarThickness: 64,
          },
          {
            type: 'bar',
            label: 'Chi thực tế (VND)',
            data: series.expenses,
            backgroundColor: '#FF5C6C',
            borderColor: '#2D2A32',
            borderWidth: 2,
            borderRadius: 12,
            maxBarThickness: 64,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        onClick: (_event, elements, chart) => {
          if (!elements || elements.length === 0) {
            chart.setActiveElements([]);
            chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
            chart.update();
          }
        },
        interaction: {
          mode: 'index',
          intersect: true,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#2D2A32',
              font: { family: "'Nunito', sans-serif", weight: 'bold', size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#2D2A32',
            bodyColor: '#2D2A32',
            borderColor: '#2D2A32',
            borderWidth: 2,
            cornerRadius: 14,
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.parsed.y || 0);
                return ` ${ctx.dataset.label}: ${formatVndInput(val)} ₫`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#2D2A32',
              font: { family: "'Baloo 2', cursive", weight: 'bold' },
            },
          },
          y: {
            position: 'left',
            beginAtZero: true,
            suggestedMax: 5_000_000,
            ticks: {
              color: '#2D2A32',
              stepSize: 1_000_000,
              callback: (v) => {
                const n = Number(v);
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
                if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
                return `${n}`;
              },
            },
          },
        },
      },
    });
  }

  private renderDonutChart(): void {
    const canvas = this.donutCanvas?.nativeElement;
    if (!canvas) return;
    const items = this.expenseByCategory();

    this.donutChart?.destroy();
    if (items.length === 0) return;

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: items.map((i) => `${i.icon} ${i.name}`),
        datasets: [
          {
            data: items.map((i) => i.amount),
            backgroundColor: items.map((i) => i.color || '#FF8FAB'),
            borderColor: '#2D2A32',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        onClick: (_event, elements, chart) => {
          if (!elements || elements.length === 0) {
            chart.setActiveElements([]);
            chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
            chart.update();
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#2D2A32',
            bodyColor: '#2D2A32',
            borderColor: '#2D2A32',
            borderWidth: 2,
            cornerRadius: 14,
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.parsed || 0);
                return ` ${formatVndInput(val)} ₫`;
              },
            },
          },
        },
      },
    });
  }

  private todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }
}
