import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Transaction,
  TxType,
  OwnerScope,
  OWNER_SCOPE_META,
} from '../../core/models/database.models';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletService } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionFormModalComponent } from '../../shared/components/transaction-form-modal.component';
import { RefundModalComponent } from '../../shared/components/refund-modal.component';
import { VndPipe } from '../../shared/pipes/vnd.pipe';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransactionFormModalComponent,
    RefundModalComponent,
    VndPipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header & Quick Action Buttons -->
      <div class="toy-card-lg p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-14 h-14 rounded-2xl bg-[#FFB020] border-2 border-[#2D2A32] shadow-[0_4px_0_#2D2A32] flex items-center justify-center text-3xl shrink-0"
          >
            📒
          </div>
          <div>
            <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#2D2A32]">
              Sổ Thu Chi & Chuyển Ví
            </h1>
            <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
              Quản lý từng đồng ra vào két sắt, hỗ trợ trả hàng Shopee/Lazada & hoàn tác 10 giây
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="openCreateModal('INCOME')"
            class="toy-btn px-4 py-2.5 bg-[#22C55E] text-white text-sm font-extrabold"
          >
            + Ting ting lúa về
          </button>
          <button
            type="button"
            (click)="openCreateModal('EXPENSE')"
            class="toy-btn px-4 py-2.5 bg-[#FF5C6C] text-white text-sm font-extrabold"
          >
            - Lại chốt đơn
          </button>
          <button
            type="button"
            (click)="openCreateModal('TRANSFER')"
            class="toy-btn px-3.5 py-2.5 bg-[#38BDF8] text-[#2D2A32] text-sm font-extrabold"
          >
            ⇄ Chuyển ví
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="toy-card p-4 bg-white space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <!-- Search input -->
          <div class="lg:col-span-2">
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Tìm kiếm nội dung
            </label>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="🔎 Tìm tên món đồ, ghi chú..."
              class="toy-input !py-1.5 !px-3 text-xs bg-[#FFFDF5]"
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-[11px] font-extrabold uppercase text-[#2D2A32]/70 mb-1">
              Loại giao dịch
            </label>
            <select
              [ngModel]="filterType()"
              (ngModelChange)="filterType.set($event)"
              class="toy-input !py-1.5 !px-2.5 text-xs bg-[#FFFDF5]"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="INCOME">🌾 Khoản Thu (+)</option>
              <option value="EXPENSE">🛒 Khoản Chi (-)</option>
              <option value="TRANSFER">🔁 Chuyển ví (⇄)</option>
            </select>
          </div>

          <!-- Actor -->
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

          <!-- Wallet -->
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

          <!-- Category -->
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
        </div>
      </div>

      <!-- DESKTOP TABLE (>= 768px): Ngày, Nội dung, Ví/Nguồn, Người, Số tiền, Trạng thái, Thao tác -->
      <div class="hidden md:block toy-card bg-white overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#FFF9EC] border-b-2 border-[#2D2A32] font-display text-xs uppercase tracking-wider text-[#2D2A32]">
                <th class="py-3.5 px-4">Ngày</th>
                <th class="py-3.5 px-4">Nội dung & Danh mục</th>
                <th class="py-3.5 px-4">Ví / Nguồn</th>
                <th class="py-3.5 px-4">Người</th>
                <th class="py-3.5 px-4 text-right">Số tiền (VND)</th>
                <th class="py-3.5 px-4 text-center">Trạng thái</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-dashed divide-[#2D2A32]/15 text-sm font-semibold">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr
                  class="hover:bg-[#FFFDF5] transition-colors"
                  [class.opacity-60]="tx.status === 'RETURNED'"
                >
                  <!-- Ngày -->
                  <td class="py-3.5 px-4 whitespace-nowrap font-bold text-[#2D2A32]">
                    {{ tx.transaction_date }}
                  </td>

                  <!-- Nội dung & Danh mục -->
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2.5">
                      <span
                        class="w-9 h-9 rounded-xl border-2 border-[#2D2A32] flex items-center justify-center text-lg shrink-0"
                        [style.backgroundColor]="getCategoryColor(tx)"
                      >
                        {{ getCategoryIcon(tx) }}
                      </span>
                      <div>
                        <div class="font-display font-extrabold text-base text-[#2D2A32] flex items-center gap-1.5">
                          <span>{{ tx.title }}</span>
                          @if (tx.is_locked) {
                            <span title="Đã khóa chỉnh sửa" class="text-xs">🔒</span>
                          }
                        </div>
                        <div class="text-xs text-[#2D2A32]/70">
                          {{ getCategoryName(tx) }}
                          @if (tx.note) {
                            <span>• "{{ tx.note }}"</span>
                          }
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Ví / Nguồn -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="font-bold text-[#2D2A32]">
                      {{ getWalletName(tx.wallet_id) }}
                    </div>
                    @if (tx.type === 'TRANSFER' && tx.to_wallet_id) {
                      <div class="text-xs font-extrabold text-[#0369A1]">
                        ➔ {{ getWalletName(tx.to_wallet_id) }}
                      </div>
                    }
                    @if (tx.status === 'RETURNED' && tx.refund_wallet_id) {
                      <div class="text-xs font-extrabold text-[#15803D]">
                        ↩️ Hoàn về: {{ getWalletName(tx.refund_wallet_id) }}
                      </div>
                    }
                  </td>

                  <!-- Người -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border-2 border-[#2D2A32]"
                      [style.backgroundColor]="ownerMeta[tx.actor].badgeBg"
                    >
                      {{ ownerMeta[tx.actor].emoji }} {{ ownerMeta[tx.actor].label }}
                    </span>
                  </td>

                  <!-- Số tiền -->
                  <td class="py-3.5 px-4 whitespace-nowrap text-right">
                    <div
                      class="money-num font-extrabold text-lg"
                      [ngClass]="{
                        'text-[#22C55E]': tx.type === 'INCOME',
                        'text-[#FF5C6C]': tx.type === 'EXPENSE',
                        'text-[#0369A1]': tx.type === 'TRANSFER',
                        'line-through': tx.status === 'RETURNED' && tx.refunded_amount === tx.amount
                      }"
                    >
                      @switch (tx.type) {
                        @case ('INCOME') { {{ tx.amount | vnd: true : 'plus' }} }
                        @case ('EXPENSE') { {{ tx.amount | vnd: true : 'minus' }} }
                        @case ('TRANSFER') { ⇄ {{ tx.amount | vnd }} }
                      }
                    </div>

                    @if (tx.status === 'RETURNED') {
                      <div class="text-xs font-extrabold text-[#15803D] money-num">
                        Gốc: {{ tx.amount | vnd }} • Đã hoàn: +{{ (tx.refunded_amount ?? tx.amount) | vnd }}
                      </div>
                    }
                  </td>

                  <!-- Trạng thái (Status Column / Badge) -->
                  <td class="py-3.5 px-4 whitespace-nowrap text-center">
                    @if (tx.status === 'RETURNED') {
                      <span
                        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                      >
                        Đã hoàn tiền ↩️
                      </span>
                    } @else {
                      <span
                        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                      >
                        Done ✓
                      </span>
                    }
                  </td>

                  <!-- Thao tác -->
                  <td class="py-3.5 px-4 whitespace-nowrap text-right">
                    <div class="inline-flex items-center justify-end gap-1.5">
                      <!-- Nút Trả hàng chỉ hiện ở EXPENSE có is_refundable = true và status = 'DONE' -->
                      @if (tx.type === 'EXPENSE' && tx.is_refundable && tx.status === 'DONE') {
                        <button
                          type="button"
                          (click)="openRefundModal(tx)"
                          class="toy-btn px-2.5 py-1.5 bg-[#E0F2FE] hover:bg-[#38BDF8] text-[#2D2A32] text-xs font-extrabold"
                          title="Quay xe trả hàng / Hoàn tiền"
                        >
                          Trả hàng ↩️
                        </button>
                      }

                      <!-- Các dòng đã is_locked = true ẩn/disable nút Sửa và Xóa -->
                      @if (!tx.is_locked && tx.status !== 'RETURNED') {
                        <button
                          type="button"
                          (click)="openEditModal(tx)"
                          class="toy-btn px-2.5 py-1.5 bg-[#FFF9EC] text-xs"
                          title="Sửa giao dịch"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          (click)="onSoftDelete(tx)"
                          class="toy-btn px-2.5 py-1.5 bg-[#FFE4E6] text-xs"
                          title="Xóa giao dịch"
                        >
                          🗑️
                        </button>
                      } @else {
                        <span
                          class="text-xs font-extrabold text-[#2D2A32]/50 px-2 py-1"
                          title="Giao dịch đã khóa không thể sửa hoặc xóa"
                        >
                          🔒 Đã khóa
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-12 text-center">
                    <div class="text-5xl mb-2">🐷💤</div>
                    <div class="font-display font-extrabold text-lg text-[#2D2A32]">
                      Sổ sạch bong kin kít, hôm nay nhà mình chưa tốn xu nào!
                    </div>
                    <p class="text-xs font-bold text-[#2D2A32]/70 mt-1">
                      Hãy bấm "+ Ting ting lúa về" hoặc "- Lại chốt đơn" ở góc trên để thêm giao dịch đầu tiên nhé.
                    </p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MOBILE CARD LIST (< 768px) -->
      <div class="md:hidden space-y-3">
        @for (tx of filteredTransactions(); track tx.id) {
          <div
            class="toy-card p-4 bg-white space-y-3"
            [class.opacity-60]="tx.status === 'RETURNED'"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-2.5 min-w-0">
                <span
                  class="w-10 h-10 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-center text-xl shrink-0"
                  [style.backgroundColor]="getCategoryColor(tx)"
                >
                  {{ getCategoryIcon(tx) }}
                </span>
                <div class="min-w-0">
                  <div class="font-display font-extrabold text-base text-[#2D2A32] truncate">
                    {{ tx.title }}
                  </div>
                  <div class="text-xs font-bold text-[#2D2A32]/70">
                    {{ tx.transaction_date }} • {{ getWalletName(tx.wallet_id) }}
                    @if (tx.type === 'TRANSFER' && tx.to_wallet_id) {
                      <span>➔ {{ getWalletName(tx.to_wallet_id) }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Status Badge -->
              @if (tx.status === 'RETURNED') {
                <span
                  class="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border-2 border-[#2D2A32] font-display font-extrabold text-[11px] shrink-0"
                >
                  Đã hoàn tiền ↩️
                </span>
              } @else {
                <span
                  class="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border-2 border-[#2D2A32] font-display font-extrabold text-[11px] shrink-0"
                >
                  Done ✓
                </span>
              }
            </div>

            @if (tx.note) {
              <div class="text-xs font-semibold text-[#2D2A32]/75 bg-[#FFFDF5] px-3 py-1.5 rounded-xl border border-[#2D2A32]/20">
                💬 "{{ tx.note }}"
              </div>
            }

            <div class="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#2D2A32]/15">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-[#2D2A32]"
                [style.backgroundColor]="ownerMeta[tx.actor].badgeBg"
              >
                {{ ownerMeta[tx.actor].emoji }} {{ ownerMeta[tx.actor].label }}
              </span>

              <div class="text-right">
                <div
                  class="money-num font-extrabold text-lg"
                  [ngClass]="{
                    'text-[#22C55E]': tx.type === 'INCOME',
                    'text-[#FF5C6C]': tx.type === 'EXPENSE',
                    'text-[#0369A1]': tx.type === 'TRANSFER'
                  }"
                >
                  @switch (tx.type) {
                    @case ('INCOME') { {{ tx.amount | vnd: true : 'plus' }} }
                    @case ('EXPENSE') { {{ tx.amount | vnd: true : 'minus' }} }
                    @case ('TRANSFER') { ⇄ {{ tx.amount | vnd }} }
                  }
                </div>
                @if (tx.status === 'RETURNED') {
                  <div class="text-[11px] font-extrabold text-[#15803D] money-num">
                    Gốc: {{ tx.amount | vnd }} • Hoàn: +{{ (tx.refunded_amount ?? tx.amount) | vnd }}
                  </div>
                }
              </div>
            </div>

            <!-- Mobile Action Row -->
            <div class="flex items-center justify-end gap-2 pt-1">
              @if (tx.type === 'EXPENSE' && tx.is_refundable && tx.status === 'DONE') {
                <button
                  type="button"
                  (click)="openRefundModal(tx)"
                  class="toy-btn px-3 py-1.5 bg-[#E0F2FE] text-xs font-extrabold"
                >
                  Trả hàng ↩️
                </button>
              }
              @if (!tx.is_locked && tx.status !== 'RETURNED') {
                <button
                  type="button"
                  (click)="openEditModal(tx)"
                  class="toy-btn px-3 py-1.5 bg-[#FFF9EC] text-xs font-extrabold"
                >
                  ✏️ Sửa
                </button>
                <button
                  type="button"
                  (click)="onSoftDelete(tx)"
                  class="toy-btn px-3 py-1.5 bg-[#FFE4E6] text-xs font-extrabold"
                >
                  🗑️ Xóa
                </button>
              } @else {
                <span class="text-xs font-extrabold text-[#2D2A32]/50">
                  🔒 Đã khóa chỉnh sửa
                </span>
              }
            </div>
          </div>
        } @empty {
          <div class="toy-card p-8 bg-white text-center">
            <div class="text-4xl mb-2">🐷💤</div>
            <div class="font-display font-extrabold text-base text-[#2D2A32]">
              Chưa có giao dịch nào phù hợp!
            </div>
          </div>
        }
      </div>

      <!-- Create / Edit Transaction Modal -->
      <app-transaction-form-modal
        [isOpen]="formModalOpen()"
        [defaultType]="formDefaultType()"
        [editTransaction]="editingTx()"
        (closed)="formModalOpen.set(false)"
      />

      <!-- 3-Component Refund Popup -->
      <app-refund-modal
        [isOpen]="refundModalOpen()"
        [transaction]="refundingTx()"
        (closed)="refundModalOpen.set(false)"
      />
    </div>
  `,
})
export class TransactionsComponent {
  readonly transactionService = inject(TransactionService);
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly ownerMeta = OWNER_SCOPE_META;

  readonly searchQuery = signal<string>('');
  readonly filterType = signal<'ALL' | TxType>('ALL');
  readonly filterActor = signal<'ALL' | OwnerScope>('ALL');
  readonly filterWalletId = signal<string>('ALL');
  readonly filterCategoryId = signal<string>('ALL');

  readonly formModalOpen = signal<boolean>(false);
  readonly formDefaultType = signal<TxType>('EXPENSE');
  readonly editingTx = signal<Transaction | null>(null);

  readonly refundModalOpen = signal<boolean>(false);
  readonly refundingTx = signal<Transaction | null>(null);

  readonly filteredTransactions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const fType = this.filterType();
    const fActor = this.filterActor();
    const fWallet = this.filterWalletId();
    const fCat = this.filterCategoryId();

    return this.transactionService.transactions().filter((tx) => {
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
      if (q) {
        const inTitle = tx.title?.toLowerCase().includes(q);
        const inNote = tx.note?.toLowerCase().includes(q);
        if (!inTitle && !inNote) return false;
      }
      return true;
    });
  });

  getWalletName(walletId: string | null): string {
    if (!walletId) return '---';
    return this.walletService.getWalletById(walletId)?.name ?? 'Ví đã ẩn';
  }

  getCategoryName(tx: Transaction): string {
    if (tx.type === 'TRANSFER') return 'Chuyển khoản nội bộ';
    return (
      this.categoryService.getCategoryById(tx.category_id)?.name ??
      (tx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu')
    );
  }

  getCategoryIcon(tx: Transaction): string {
    if (tx.type === 'TRANSFER') return '🔁';
    return (
      this.categoryService.getCategoryById(tx.category_id)?.icon ??
      (tx.type === 'INCOME' ? '🌾' : '🛒')
    );
  }

  getCategoryColor(tx: Transaction): string {
    if (tx.type === 'TRANSFER') return '#E0F2FE';
    return (
      this.categoryService.getCategoryById(tx.category_id)?.color ??
      (tx.type === 'INCOME' ? '#DCFCE7' : '#FFE4E6')
    );
  }

  openCreateModal(type: TxType): void {
    this.editingTx.set(null);
    this.formDefaultType.set(type);
    this.formModalOpen.set(true);
  }

  openEditModal(tx: Transaction): void {
    if (tx.is_locked || tx.status === 'RETURNED') return;
    this.editingTx.set(tx);
    this.formDefaultType.set(tx.type);
    this.formModalOpen.set(true);
  }

  openRefundModal(tx: Transaction): void {
    if (tx.type !== 'EXPENSE' || !tx.is_refundable || tx.status !== 'DONE') {
      return;
    }
    this.refundingTx.set(tx);
    this.refundModalOpen.set(true);
  }

  async onSoftDelete(tx: Transaction): Promise<void> {
    if (tx.is_locked) return;
    if (!confirm(`Bạn có chắc muốn xóa giao dịch "${tx.title}" không?`)) {
      return;
    }

    try {
      await this.transactionService.softDeleteTransaction(tx.id);
      this.toast.show(
        'info',
        'Đã xóa giao dịch! 🗑️',
        `Đã xóa mềm khoản "${tx.title}" và cập nhật lại số dư ví.`
      );
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không thể xóa giao dịch! 🚨',
        err?.message || 'Giao dịch đã bị khóa hoặc có lỗi kết nối.'
      );
    }
  }
}
