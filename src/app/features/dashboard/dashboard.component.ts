import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
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
import {
  OwnerScope,
  OWNER_SCOPE_META,
  TxType,
} from '../../core/models/database.models';
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
      <!-- 1. Piggy Mascot Header Banner -->
      <app-piggy-mascot
        [mood]="piggyMood()"
        [savingsRate]="periodKpis().savingsRate"
      />

      <!-- 2. Multi-Dimensional Compact Filter Bar -->
      <div class="toy-card p-4 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-dashed border-[#2D2A32]/15">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔍</span>
            <h3 class="font-display font-extrabold text-base text-[#2D2A32]">
              Bộ lọc soi sổ chi tiêu
            </h3>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              (click)="setThisMonthFilter()"
              class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] font-display font-bold text-xs cursor-pointer transition-all"
              [ngClass]="
                rangePreset() === 'THIS_MONTH'
                  ? 'bg-[#FFB020] shadow-[0_2px_0_#2D2A32]'
                  : 'bg-[#FFFDF5] hover:bg-[#FEF3C7]'
              "
            >
              📅 Tháng này
            </button>
            <button
              type="button"
              (click)="setAllTimeFilter()"
              class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] font-display font-bold text-xs cursor-pointer transition-all"
              [ngClass]="
                rangePreset() === 'ALL_TIME'
                  ? 'bg-[#FFB020] shadow-[0_2px_0_#2D2A32]'
                  : 'bg-[#FFFDF5] hover:bg-[#FEF3C7]'
              "
            >
              ♾️ Từ tháng đầu tiên có dữ liệu
            </button>
            <button
              type="button"
              (click)="resetFilters()"
              class="px-3 py-1 rounded-xl border-2 border-[#2D2A32] bg-white hover:bg-[#FFE4E6] font-display font-bold text-xs cursor-pointer"
            >
              🔄 Đặt lại
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <!-- Loại Thu / Chi -->
          <div>
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Loại giao dịch
            </label>
            <select
              [ngModel]="filterType()"
              (ngModelChange)="filterType.set($event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
            >
              <option value="ALL">Tất cả Thu & Chi</option>
              <option value="INCOME">🌾 Chỉ khoản Thu</option>
              <option value="EXPENSE">🛒 Chỉ khoản Chi</option>
            </select>
          </div>

          <!-- Người thực hiện -->
          <div>
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Người thực hiện
            </label>
            <select
              [ngModel]="filterActor()"
              (ngModelChange)="filterActor.set($event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
            >
              <option value="ALL">👨‍👩‍👧 Tất cả</option>
              <option value="WIFE">🐱 Vợ yêu</option>
              <option value="HUSBAND">🐶 Chồng yêu</option>
              <option value="SHARED">🐷 Quỹ chung</option>
            </select>
          </div>

          <!-- Nguồn tiền / Ví -->
          <div>
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Nguồn tiền / Ví
            </label>
            <select
              [ngModel]="filterWalletId()"
              (ngModelChange)="filterWalletId.set($event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
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
              [ngModel]="filterCategoryId()"
              (ngModelChange)="filterCategoryId.set($event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
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
              [ngModel]="filterStartDate()"
              (ngModelChange)="onCustomDateChange('start', $event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
            />
          </div>

          <!-- Đến ngày -->
          <div>
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              [ngModel]="filterEndDate()"
              (ngModelChange)="onCustomDateChange('end', $event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
            />
          </div>
        </div>
      </div>

      <!-- 3. KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Tổng tiền hiện có + 3 nhóm ví Vợ / Chồng / Chung -->
        <div class="toy-card p-5 bg-[#FFF9EC] flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#2D2A32]/70">
                💰 Tổng tiền hiện có
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF3C7] border border-[#2D2A32]"
              >
                {{ walletService.activeWallets().length }} ví
              </span>
            </div>
            <div class="money-num font-extrabold text-2xl sm:text-3xl text-[#2D2A32] mt-1">
              {{ walletService.totalBalance() | vnd }}
            </div>
          </div>

          <!-- 3 Owner Scope Mini Breakdown Stickers -->
          <div class="mt-4 pt-3 border-t-2 border-dashed border-[#2D2A32]/15 space-y-1.5 text-xs font-bold">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1">🐱 Vợ giữ:</span>
              <span class="money-num font-extrabold text-[#BE123C]">
                {{ walletService.balanceByOwner().WIFE | vnd }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1">🐶 Chồng giữ:</span>
              <span class="money-num font-extrabold text-[#0369A1]">
                {{ walletService.balanceByOwner().HUSBAND | vnd }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1">🐷 Quỹ chung:</span>
              <span class="money-num font-extrabold text-[#B45309]">
                {{ walletService.balanceByOwner().SHARED | vnd }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Tổng Thu trong kỳ -->
        <div class="toy-card p-5 bg-[#DCFCE7]/55 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#15803D]">
                🌾 Tổng Thu trong kỳ
              </span>
              <span class="text-2xl">📈</span>
            </div>
            <div class="money-num font-extrabold text-2xl sm:text-3xl text-[#15803D] mt-1">
              {{ periodKpis().totalIncome | vnd: true : 'plus' }}
            </div>
          </div>

          <div class="mt-4 pt-3 border-t-2 border-dashed border-[#15803D]/25 flex items-center justify-between text-xs font-bold text-[#15803D]">
            <span>Số giao dịch thu:</span>
            <span class="money-num font-extrabold">{{ periodKpis().incomeCount }} khoản</span>
          </div>
        </div>

        <!-- Card 3: Tổng Chi thực tế (Đã trừ hoàn tiền) + Số dư ròng -->
        <div class="toy-card p-5 bg-[#FFE4E6]/55 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase text-[#BE123C]">
                🛒 Tổng Chi thực tế
              </span>
              <span class="text-2xl">💸</span>
            </div>
            <div class="money-num font-extrabold text-2xl sm:text-3xl text-[#BE123C] mt-1">
              {{ periodKpis().netExpense | vnd: true : 'minus' }}
            </div>
            @if (periodKpis().totalRefunded > 0) {
              <div class="text-[11px] font-extrabold text-[#0369A1] mt-0.5">
                ↩️ Đã trừ hoàn tiền: {{ periodKpis().totalRefunded | vnd }}
              </div>
            }
          </div>

          <div class="mt-4 pt-3 border-t-2 border-dashed border-[#BE123C]/25 flex items-center justify-between text-xs font-bold">
            <span>Số dư ròng kỳ này:</span>
            <span
              class="money-num font-extrabold"
              [ngClass]="
                periodKpis().netCashflow >= 0 ? 'text-[#15803D]' : 'text-[#BE123C]'
              "
            >
              {{
                periodKpis().netCashflow
                  | vnd: true : (periodKpis().netCashflow >= 0 ? 'plus' : 'none')
              }}
            </span>
          </div>
        </div>

        <!-- Card 4: Tổng đang Cho mượn (OPEN) & Tổng đang Nợ (OPEN) -->
        <div class="toy-card p-5 bg-white flex flex-col justify-between">
          <div class="space-y-2.5">
            <div class="p-2.5 rounded-2xl bg-[#FEF3C7] border-2 border-[#B45309]">
              <div class="flex items-center justify-between text-xs font-extrabold text-[#B45309]">
                <span>🤝 Đang Cho Mượn (OPEN)</span>
                <a routerLink="/debts-loans" class="underline">Xem →</a>
              </div>
              <div class="money-num font-extrabold text-lg text-[#B45309] mt-0.5">
                {{ debtLoanService.totalOpenLend() | vnd }}
              </div>
            </div>

            <div class="p-2.5 rounded-2xl bg-[#EDE9FE] border-2 border-[#6D28D9]">
              <div class="flex items-center justify-between text-xs font-extrabold text-[#6D28D9]">
                <span>🏦 Đang Nợ (OPEN)</span>
                <a routerLink="/debts-loans" class="underline">Xem →</a>
              </div>
              <div class="money-num font-extrabold text-lg text-[#6D28D9] mt-0.5">
                {{ debtLoanService.totalOpenDebt() | vnd }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Reminder Widget (Sắp đến hạn trong 7 ngày hoặc Quá hạn đòi/trả) -->
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

      <!-- 5. Charts Section (Bar + Line Cashflow & Donut Expense Breakdown) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Biểu đồ cột đôi Thu - Chi + Đường Tỉ lệ tiết kiệm (%) -->
        <div class="toy-card p-5 bg-white lg:col-span-2 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                📊 Thu - Chi & Tỉ lệ tiết kiệm theo tháng
              </h3>
              <p class="text-xs font-bold text-[#2D2A32]/70">
                Cột xanh: Thu • Cột đỏ: Chi thực tế (đã trừ hoàn tiền) • Đường cam: % Tiết kiệm
              </p>
            </div>
          </div>
          <div class="relative h-72 sm:h-80 w-full flex-1">
            <canvas #cashflowCanvas></canvas>
          </div>
        </div>

        <!-- Biểu đồ Donut cơ cấu Chi theo danh mục -->
        <div class="toy-card p-5 bg-white flex flex-col">
          <div class="mb-4">
            <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
              🍩 Cơ cấu Chi tiêu theo danh mục
            </h3>
            <p class="text-xs font-bold text-[#2D2A32]/70">
              Tiền nhà mình bay đi đâu nhiều nhất?
            </p>
          </div>

          <div class="relative h-60 w-full flex items-center justify-center">
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

          <!-- Category Legend List -->
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

      <!-- 6. Mini Wallet Cards Row -->
      <div class="toy-card p-5 bg-white">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">💳</span>
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#2D2A32]">
                Dàn Ví & Nguồn Tiền Gia Đình
              </h3>
              <p class="text-xs font-bold text-[#2D2A32]/70">
                Số dư thực tế tính từ view wallet_balances
              </p>
            </div>
          </div>
          <a
            routerLink="/settings"
            class="toy-btn px-3 py-1.5 bg-[#FFF9EC] text-xs font-extrabold"
          >
            ⚙️ Quản lý ví
          </a>
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
    </div>
  `,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  readonly transactionService = inject(TransactionService);
  readonly debtLoanService = inject(DebtLoanService);
  readonly dataSync = inject(DataSyncService);

  @ViewChild('cashflowCanvas') cashflowCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  readonly ownerMeta = OWNER_SCOPE_META;

  // Filters
  readonly rangePreset = signal<'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('ALL_TIME');
  readonly filterType = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly filterActor = signal<'ALL' | OwnerScope>('ALL');
  readonly filterWalletId = signal<string>('ALL');
  readonly filterCategoryId = signal<string>('ALL');
  readonly filterStartDate = signal<string>('');
  readonly filterEndDate = signal<string>(this.todayIso());

  private cashflowChart: Chart | null = null;
  private donutChart: Chart | null = null;
  private viewReady = false;

  constructor() {
    // Initialize start date automatically from the earliest month with data in DB
    effect(() => {
      const earliest = this.transactionService.earliestTransactionDate();
      if (this.rangePreset() === 'ALL_TIME' && earliest) {
        this.filterStartDate.set(earliest);
      }
    });

    // Re-render charts whenever filtered data changes
    effect(() => {
      const _monthly = this.monthlyChartSeries();
      const _donut = this.expenseByCategory();
      if (this.viewReady) {
        queueMicrotask(() => this.renderCharts());
      }
    });
  }

  readonly filteredTransactions = computed(() => {
    const list = this.transactionService.transactions();
    const fType = this.filterType();
    const fActor = this.filterActor();
    const fWallet = this.filterWalletId();
    const fCat = this.filterCategoryId();
    const start = this.filterStartDate();
    const end = this.filterEndDate();

    return list.filter((tx) => {
      if (fType !== 'ALL' && tx.type !== fType) return false;
      if (fActor !== 'ALL' && tx.actor !== fActor) return false;
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
    let totalIncome = 0;
    let grossExpense = 0;
    let totalRefunded = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const tx of txs) {
      if (tx.type === 'INCOME') {
        totalIncome += Number(tx.amount || 0);
        incomeCount++;
      } else if (tx.type === 'EXPENSE') {
        const amt = Number(tx.amount || 0);
        const ref =
          tx.status === 'RETURNED' ? Number(tx.refunded_amount ?? amt) : 0;
        grossExpense += amt;
        totalRefunded += ref;
        expenseCount++;
      }
    }

    // Net Expense already subtracts refunded_amount (and never adds to totalIncome)
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
    };
  });

  readonly piggyMood = computed<PiggyMood>(() => {
    const kpi = this.periodKpis();
    if (kpi.totalTxCount === 0) return 'SLEEPY';
    if (kpi.netExpense > kpi.totalIncome) return 'BROKE';
    if (kpi.savingsRate >= 30) return 'RICH';
    return 'CHILL';
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

    // Also blend with monthly_cashflow_summary view if no category/wallet filter is active
    const useViewFallback =
      txs.length === 0 &&
      this.filterWalletId() === 'ALL' &&
      this.filterCategoryId() === 'ALL';

    if (useViewFallback) {
      for (const s of this.transactionService.monthlySummaries()) {
        if (this.filterActor() !== 'ALL' && s.actor !== this.filterActor()) {
          continue;
        }
        const mKey = s.month_start.slice(0, 7);
        const cur = monthMap.get(mKey) ?? { income: 0, expense: 0 };
        cur.income += Number(s.total_income || 0);
        cur.expense += Number(s.total_expense || 0);
        monthMap.set(mKey, cur);
      }
    } else {
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

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.cashflowChart?.destroy();
    this.donutChart?.destroy();
  }

  setThisMonthFilter(): void {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-01`;
    this.rangePreset.set('THIS_MONTH');
    this.filterStartDate.set(start);
    this.filterEndDate.set(this.todayIso());
  }

  setAllTimeFilter(): void {
    this.rangePreset.set('ALL_TIME');
    this.filterStartDate.set(this.transactionService.earliestTransactionDate());
    this.filterEndDate.set(this.todayIso());
  }

  onCustomDateChange(which: 'start' | 'end', val: string): void {
    this.rangePreset.set('CUSTOM');
    if (which === 'start') {
      this.filterStartDate.set(val);
    } else {
      this.filterEndDate.set(val);
    }
  }

  resetFilters(): void {
    this.filterType.set('ALL');
    this.filterActor.set('ALL');
    this.filterWalletId.set('ALL');
    this.filterCategoryId.set('ALL');
    this.setAllTimeFilter();
  }

  private renderCharts(): void {
    this.renderCashflowChart();
    this.renderDonutChart();
  }

  private renderCashflowChart(): void {
    if (!this.cashflowCanvas?.nativeElement) return;
    const series = this.monthlyChartSeries();

    this.cashflowChart?.destroy();
    this.cashflowChart = new Chart(this.cashflowCanvas.nativeElement, {
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
        interaction: {
          mode: 'index',
          intersect: false,
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
    if (!this.donutCanvas?.nativeElement) return;
    const items = this.expenseByCategory();

    this.donutChart?.destroy();
    if (items.length === 0) return;

    this.donutChart = new Chart(this.donutCanvas.nativeElement, {
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
