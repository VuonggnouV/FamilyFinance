import {
  Component,
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
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { WalletService } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DebtLoanService } from '../../core/services/debt-loan.service';
import { DataSyncService } from '../../core/services/data-sync.service';
import { OWNER_SCOPE_META } from '../../core/models/database.models';
import {
  PiggyMascotComponent,
  PiggyMood,
} from '../../shared/components/piggy-mascot.component';
import { VndPipe, formatVndInput } from '../../shared/pipes/vnd.pipe';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
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
    VndPipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- 1. Piggy Mascot Header Banner (Multi-context + Click/Randomize) -->
      <app-piggy-mascot
        [mood]="piggyMood()"
        [savingsRate]="periodKpis().savingsRate"
        [triggerCount]="transactionService.transactions().length"
      />

      <!-- ======================================================================= -->
      <!-- 2. TÀI SẢN & TỔNG TIỀN HIỆN CÓ (NẰM NGOÀI / TRƯỚC BỘ LỌC)               -->
      <!-- ======================================================================= -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Card Tổng tiền hiện có + Chi tiết 3 nhóm ví Vợ / Chồng / Chung -->
        <div class="toy-card-lg p-5 bg-[#FFF9EC] md:col-span-2 flex flex-col justify-between">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-extrabold uppercase text-[#2D2A32]/75">
                  💰 TỔNG TIỀN HIỆN CÓ TRONG KÉT SẮT
                </span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF3C7] border border-[#2D2A32]"
                >
                  {{ walletService.activeWallets().length }} ví đang dùng
                </span>
              </div>
              <div class="money-num font-extrabold text-3xl sm:text-4xl text-[#15803D] mt-1">
                {{ walletService.totalBalance() | vnd }}
              </div>
            </div>

            <a
              routerLink="/settings"
              class="toy-btn px-3 py-1.5 bg-white text-xs font-extrabold"
            >
              ⚙️ Quản lý ví
            </a>
          </div>

          <!-- 3 Owner Scope Mini Breakdown Stickers -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3 border-t-2 border-dashed border-[#2D2A32]/15">
            <div class="p-2.5 rounded-2xl bg-[#FFE4E6] border-2 border-[#2D2A32] flex sm:flex-col justify-between">
              <span class="text-xs font-extrabold text-[#BE123C]">🐱 Vợ giữ:</span>
              <span class="money-num font-extrabold text-base text-[#BE123C]">
                {{ walletService.balanceByOwner().WIFE | vnd }}
              </span>
            </div>
            <div class="p-2.5 rounded-2xl bg-[#E0F2FE] border-2 border-[#2D2A32] flex sm:flex-col justify-between">
              <span class="text-xs font-extrabold text-[#0369A1]">🐶 Chồng giữ:</span>
              <span class="money-num font-extrabold text-base text-[#0369A1]">
                {{ walletService.balanceByOwner().HUSBAND | vnd }}
              </span>
            </div>
            <div class="p-2.5 rounded-2xl bg-[#FEF3C7] border-2 border-[#2D2A32] flex sm:flex-col justify-between">
              <span class="text-xs font-extrabold text-[#B45309]">🐷 Quỹ chung:</span>
              <span class="money-num font-extrabold text-base text-[#B45309]">
                {{ walletService.balanceByOwner().SHARED | vnd }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card Tổng đang Cho mượn (OPEN) & Tổng đang Nợ (OPEN) -->
        <div class="toy-card p-5 bg-white flex flex-col justify-between gap-3">
          <div class="p-3 rounded-2xl bg-[#FEF3C7] border-2 border-[#B45309]">
            <div class="flex items-center justify-between text-xs font-extrabold text-[#B45309]">
              <span>🤝 Đang Cho Mượn (OPEN)</span>
              <a routerLink="/debts-loans" class="underline">Xem sổ →</a>
            </div>
            <div class="money-num font-extrabold text-xl text-[#B45309] mt-1">
              {{ debtLoanService.totalOpenLend() | vnd }}
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-[#EDE9FE] border-2 border-[#6D28D9]">
            <div class="flex items-center justify-between text-xs font-extrabold text-[#6D28D9]">
              <span>🏦 Đang Nợ (OPEN)</span>
              <a routerLink="/debts-loans" class="underline">Xem sổ →</a>
            </div>
            <div class="money-num font-extrabold text-xl text-[#6D28D9] mt-1">
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
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                  Nhắc việc Đòi tiền & Trả nợ!
                </h3>
                <p class="text-xs font-bold text-[#2D2A32]/70">
                  Các khoản sắp tới hạn trong 7 ngày hoặc đã quá hạn hẹn
                </p>
              </div>
            </div>
            <a
              routerLink="/debts-loans"
              class="toy-btn px-3 py-1.5 bg-[#FFB020] text-xs font-extrabold"
            >
              Xử lý ngay →
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
                    Hạn trả: {{ rem.item.due_date }} • Còn lại:
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
                      Alo bạn ơi trả tiền! 🔔
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
                      {{ rem.diffDays === 0 ? 'Hôm nay đến hạn!' : 'Còn ' + rem.diffDays + ' ngày' }} ⏳
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================================= -->
      <!-- 3. BỘ LỌC SOI SỔ CHI TIÊU (CHỌN XONG BẤM "ÁP DỤNG" MỚI RA KẾT QUẢ)      -->
      <!-- ======================================================================= -->
      <div class="toy-card-lg p-5 bg-white space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-[#2D2A32]/15">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔍</span>
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                Bộ lọc soi sổ chi tiêu
              </h3>
              <p class="text-xs font-bold text-[#2D2A32]/70">
                Chọn tiêu chí rồi bấm nút "Áp dụng bộ lọc" để xem kết quả
              </p>
            </div>
          </div>

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
              ♾️ Từ đầu tới nay
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Loại Thu / Chi -->
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

          <!-- Nguồn tiền / Ví -->
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

          <!-- Danh mục -->
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

          <!-- Từ ngày -->
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

          <!-- Đến ngày -->
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

        <!-- Apply Filter Action Row + Open Dashboard Charts Popup Button -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t-2 border-dashed border-[#2D2A32]/15">
          <div class="text-xs font-bold text-[#2D2A32]/75">
            @if (hasPendingFilterChanges()) {
              <span class="text-[#BE123C] font-extrabold">
                ⚡ Bạn vừa đổi tiêu chí lọc — bấm "Áp dụng bộ lọc" để cập nhật số liệu nhé!
              </span>
            } @else {
              <span>
                ✅ Đang hiển thị kết quả từ <strong>{{ appliedStartDate() || 'đầu' }}</strong> đến <strong>{{ appliedEndDate() }}</strong>
              </span>
            }
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              (click)="applyFilters()"
              class="toy-btn flex-1 sm:flex-initial px-5 py-2.5 text-sm font-extrabold"
              [ngClass]="
                hasPendingFilterChanges()
                  ? 'bg-[#22C55E] text-white animate-bounce'
                  : 'bg-[#FFB020] text-[#2D2A32]'
              "
            >
              ✅ Áp dụng bộ lọc
            </button>

            <button
              type="button"
              (click)="openChartsModal()"
              class="toy-btn flex-1 sm:flex-initial px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#2D2A32] text-sm font-extrabold"
            >
              📊 Mở Dashboard Biểu Đồ
            </button>
          </div>
        </div>

        <!-- Filtered Period Results Cards (Inside Filter Box) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <!-- Tổng Thu trong kỳ lọc -->
          <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#DCFCE7]/60 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#15803D]">
                🌾 Tổng Thu kỳ lọc
              </span>
              <span class="text-xl">📈</span>
            </div>
            <div class="money-num font-extrabold text-2xl text-[#15803D] mt-1">
              {{ periodKpis().totalIncome | vnd: true : 'plus' }}
            </div>
            <div class="text-xs font-bold text-[#15803D] mt-2">
              {{ periodKpis().incomeCount }} khoản thu
            </div>
          </div>

          <!-- Tổng Chi thực tế kỳ lọc -->
          <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#FFE4E6]/60 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#BE123C]">
                🛒 Tổng Chi thực tế
              </span>
              <span class="text-xl">💸</span>
            </div>
            <div class="money-num font-extrabold text-2xl text-[#BE123C] mt-1">
              {{ periodKpis().netExpense | vnd: true : 'minus' }}
            </div>
            <div class="text-xs font-bold text-[#BE123C] mt-2">
              {{ periodKpis().expenseCount }} khoản chi
              @if (periodKpis().totalRefunded > 0) {
                <span>(Đã hoàn: {{ periodKpis().totalRefunded | vnd }})</span>
              }
            </div>
          </div>

          <!-- Số dư ròng & Tỉ lệ tiết kiệm kỳ lọc -->
          <div class="p-4 rounded-2xl border-2 border-[#2D2A32] bg-[#FFF9EC] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#2D2A32]/75">
                ⚖️ Số dư ròng kỳ lọc
              </span>
              <span class="text-xl">🐷</span>
            </div>
            <div
              class="money-num font-extrabold text-2xl mt-1"
              [ngClass]="
                periodKpis().netCashflow >= 0 ? 'text-[#15803D]' : 'text-[#BE123C]'
              "
            >
              {{
                periodKpis().netCashflow
                  | vnd: true : (periodKpis().netCashflow >= 0 ? 'plus' : 'none')
              }}
            </div>
            <div class="text-xs font-bold text-[#2D2A32]/75 mt-2">
              Tỉ lệ tiết kiệm:
              <strong class="money-num">{{ periodKpis().savingsRate.toFixed(0) }}%</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Mini Wallet Cards Row -->
      <div class="toy-card p-5 bg-white">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">💳</span>
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                Chi Tiết Các Ví Trong Nhà
              </h3>
              <p class="text-xs font-bold text-[#2D2A32]/70">
                Số dư thực tế của từng nguồn tiền
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          @for (w of walletService.activeWallets(); track w.id) {
            <div
              class="p-4 rounded-2xl border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] flex flex-col justify-between"
              [style.backgroundColor]="ownerMeta[w.owner_scope].badgeBg"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-display font-extrabold text-base text-[#2D2A32] truncate">
                  {{ w.name }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white border border-[#2D2A32] shrink-0"
                >
                  {{ ownerMeta[w.owner_scope].emoji }} {{ ownerMeta[w.owner_scope].label }}
                </span>
              </div>
              <div class="money-num font-extrabold text-xl text-[#2D2A32] mt-2">
                {{ w.current_balance | vnd }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ======================================================================= -->
      <!-- 5. POPUP MODAL: DASHBOARD BIỂU ĐỒ PHÂN TÍCH                             -->
      <!-- ======================================================================= -->
      @if (chartsModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D2A32]/65 backdrop-blur-xs overflow-y-auto"
          (click)="closeChartsModal()"
        >
          <div
            class="toy-card-lg w-full max-w-5xl p-4 sm:p-6 bg-[#FFFDF5] my-auto max-h-[92dvh] overflow-y-auto space-y-5"
            (click)="$event.stopPropagation(); dismissChartTooltips()"
          >
            <!-- Popup Header -->
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <div class="flex items-center gap-2.5">
                <span class="text-3xl">📊</span>
                <div>
                  <h3 class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32]">
                    Dashboard Biểu Đồ Phân Tích
                  </h3>
                  <p class="text-xs font-bold text-[#2D2A32]/70">
                    💡 Chạm vào cột để xem chi tiết • Chạm ra ngoài khoảng trống để ẩn bảng thông tin
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="closeChartsModal()"
                class="toy-btn px-3.5 py-1.5 bg-white text-sm font-extrabold"
              >
                ✕ Đóng
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <!-- Biểu đồ cột đôi Thu - Chi + Đường Tỉ lệ tiết kiệm (%) -->
              <div class="toy-card p-4 sm:p-5 bg-white lg:col-span-2 flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="font-display font-extrabold text-base sm:text-lg text-[#2D2A32]">
                      📊 Thu - Chi & Tỉ lệ tiết kiệm theo tháng
                    </h4>
                    <p class="text-xs font-bold text-[#2D2A32]/70">
                      Cột xanh: Thu • Cột đỏ: Chi thực tế • Đường cam: % Tiết kiệm
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="dismissChartTooltips(); $event.stopPropagation()"
                    class="px-2.5 py-1 rounded-xl border border-[#2D2A32] bg-[#FFF9EC] text-[11px] font-extrabold cursor-pointer"
                  >
                    Ẩn chi tiết
                  </button>
                </div>
                <div
                  class="relative h-64 sm:h-80 w-full flex-1"
                  (click)="$event.stopPropagation()"
                >
                  <canvas #cashflowCanvas></canvas>
                </div>
              </div>

              <!-- Biểu đồ Donut cơ cấu Chi theo danh mục -->
              <div class="toy-card p-4 sm:p-5 bg-white flex flex-col">
                <div class="mb-3">
                  <h4 class="font-display font-extrabold text-base sm:text-lg text-[#2D2A32]">
                    🍩 Cơ cấu Chi tiêu theo danh mục
                  </h4>
                  <p class="text-xs font-bold text-[#2D2A32]/70">
                    Tiền nhà mình bay đi đâu nhiều nhất?
                  </p>
                </div>

                <div
                  class="relative h-56 w-full flex items-center justify-center"
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
                  <div class="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
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
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                (click)="closeChartsModal()"
                class="toy-btn px-6 py-2.5 bg-[#FFB020] text-[#2D2A32] text-sm font-extrabold"
              >
                👍 Đã xem xong
              </button>
            </div>
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

  @ViewChild('cashflowCanvas') cashflowCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas?: ElementRef<HTMLCanvasElement>;

  readonly ownerMeta = OWNER_SCOPE_META;

  // Draft Filter Controls (Edited by user before clicking "Áp dụng bộ lọc")
  readonly draftRangePreset = signal<'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('ALL_TIME');
  readonly draftType = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly draftWalletId = signal<string>('ALL');
  readonly draftCategoryId = signal<string>('ALL');
  readonly draftStartDate = signal<string>('');
  readonly draftEndDate = signal<string>(this.todayIso());

  // Applied Filter State (Drives KPIs & Charts only after clicking "Áp dụng bộ lọc")
  readonly appliedType = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly appliedWalletId = signal<string>('ALL');
  readonly appliedCategoryId = signal<string>('ALL');
  readonly appliedStartDate = signal<string>('');
  readonly appliedEndDate = signal<string>(this.todayIso());

  // Charts Popup Modal State
  readonly chartsModalOpen = signal<boolean>(false);

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
      setTimeout(() => this.renderCharts(), 50);
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
    this.applyFilters();
  }

  setAllTimeDraft(): void {
    this.draftRangePreset.set('ALL_TIME');
    this.draftStartDate.set(this.transactionService.earliestTransactionDate());
    this.draftEndDate.set(this.todayIso());
    this.applyFilters();
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
    // Smart context: If user shopped multiple times today (>= 2 orders or >= 300k today), react to today's shopping!
    if (kpi.todayExpenseCount >= 2 || kpi.todayNetExpense >= 300_000) {
      return 'SHOPPING_SPREE';
    }
    if (kpi.savingsRate >= 30) return 'RICH';
    if (kpi.savingsRate >= 10) return 'CHILL';
    return 'TIGHT';
  });

  readonly expenseByCategory = computed(() => {
    const txs = this.filteredTransactions().filter((t) => t.type === 'EXPENSE');
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
    const txs = this.filteredTransactions();
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
    const savingsRates: number[] = [];

    for (const k of sortedKeys) {
      const [yyyy, mm] = k.split('-');
      labels.push(`T${mm}/${yyyy}`);
      const val = monthMap.get(k)!;
      incomes.push(val.income);
      expenses.push(val.expense);
      const rate =
        val.income > 0
          ? Math.max(-100, Math.round(((val.income - val.expense) / val.income) * 100))
          : 0;
      savingsRates.push(rate);
    }

    return { labels, incomes, expenses, savingsRates };
  });

  openChartsModal(): void {
    this.applyFilters();
    this.chartsModalOpen.set(true);
    setTimeout(() => {
      this.renderCharts();
    }, 60);
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
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.cashflowChart?.destroy();
    this.cashflowChart = null;
    this.donutChart?.destroy();
    this.donutChart = null;
  }

  private renderCharts(): void {
    this.renderCashflowChart();
    this.renderDonutChart();
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
            type: 'line',
            label: '% Tiết kiệm',
            data: series.savingsRates,
            yAxisID: 'y1',
            borderColor: '#FFB020',
            backgroundColor: '#FEF3C7',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#FFB020',
            pointBorderColor: '#2D2A32',
            pointBorderWidth: 2,
            tension: 0.3,
          },
          {
            type: 'bar',
            label: 'Tổng Thu (VND)',
            data: series.incomes,
            yAxisID: 'y',
            backgroundColor: '#22C55E',
            borderColor: '#2D2A32',
            borderWidth: 2,
            borderRadius: 10,
          },
          {
            type: 'bar',
            label: 'Chi thực tế (VND)',
            data: series.expenses,
            yAxisID: 'y',
            backgroundColor: '#FF5C6C',
            borderColor: '#2D2A32',
            borderWidth: 2,
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        onClick: (_event, elements, chart) => {
          // If user taps empty space inside the chart, dismiss sticky tooltip on mobile
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
                if (ctx.dataset.yAxisID === 'y1') {
                  return ` ${ctx.dataset.label}: ${val}%`;
                }
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
            ticks: {
              color: '#2D2A32',
              callback: (v) => {
                const n = Number(v);
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
                return `${n}`;
              },
            },
          },
          y1: {
            position: 'right',
            min: -100,
            max: 100,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#B45309',
              callback: (v) => `${v}%`,
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
        cutout: '62%',
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
