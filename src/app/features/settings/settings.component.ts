import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Wallet,
  Category,
  OwnerScope,
  WalletType,
  CategoryType,
  OWNER_SCOPE_META,
  WALLET_TYPE_META,
} from '../../core/models/database.models';
import { WalletService, WalletWithBalance } from '../../core/services/wallet.service';
import { CategoryService } from '../../core/services/category.service';
import { FamilyService } from '../../core/services/family.service';
import { ToastService } from '../../core/services/toast.service';
import {
  VndPipe,
  formatVndInput,
  parseVndInput,
} from '../../shared/pipes/vnd.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    <div class="space-y-6">
      <!-- Top Section Switcher Tabs (Default: FAMILY so Invite Code & Family Info is immediately visible!) -->
      <div class="toy-card p-2 bg-white grid grid-cols-3 gap-2">
        <button
          type="button"
          (click)="section.set('FAMILY')"
          class="toy-btn py-3 px-3 text-xs sm:text-sm font-extrabold"
          [ngClass]="
            section() === 'FAMILY'
              ? 'bg-[#38BDF8] text-[#2D2A32]'
              : 'bg-[#FFFDF5] text-[#2D2A32]/75'
          "
        >
          🏡 Thông tin Gia đình & Mã mời
        </button>
        <button
          type="button"
          (click)="section.set('WALLETS')"
          class="toy-btn py-3 px-3 text-xs sm:text-sm font-extrabold"
          [ngClass]="
            section() === 'WALLETS'
              ? 'bg-[#FFB020] text-[#2D2A32]'
              : 'bg-[#FFFDF5] text-[#2D2A32]/75'
          "
        >
          💳 Ví & Nguồn tiền
        </button>
        <button
          type="button"
          (click)="section.set('CATEGORIES')"
          class="toy-btn py-3 px-3 text-xs sm:text-sm font-extrabold"
          [ngClass]="
            section() === 'CATEGORIES'
              ? 'bg-[#FF8FAB] text-[#2D2A32]'
              : 'bg-[#FFFDF5] text-[#2D2A32]/75'
          "
        >
          🏷️ Danh mục Thu/Chi
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- SECTION 1: WALLETS MANAGEMENT (Full CRUD + FK 23503 Protection) -->
      <!-- ============================================================== -->
      @if (section() === 'WALLETS') {
        <div class="space-y-4">
          <div class="toy-card-lg p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
                💳 Quản lý Ví & Nguồn tiền
              </h2>
              <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
                Thêm thoải mái TPBank, VietinBank, BIDV, Tiền mặt, Ví MoMo... gắn với Vợ / Chồng / Chung
              </p>
            </div>
            <button
              type="button"
              (click)="openWalletModal()"
              class="toy-btn px-5 py-2.5 bg-[#22C55E] text-white text-sm font-extrabold shrink-0"
            >
              + Thêm ví mới
            </button>
          </div>

          <!-- Quick Bank / E-Wallet Presets Bar -->
          <div class="toy-card p-3.5 bg-[#FFF9EC] flex flex-wrap items-center gap-2">
            <span class="text-xs font-extrabold text-[#2D2A32]/75">⚡ Tạo nhanh nguồn tiền mẫu:</span>
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
                    (click)="openWalletModal(w)"
                    class="toy-btn px-3 py-1.5 bg-[#FFF9EC] text-xs font-extrabold"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    type="button"
                    (click)="toggleArchiveWallet(w)"
                    class="toy-btn px-3 py-1.5 bg-[#E0F2FE] text-xs font-extrabold"
                  >
                    {{ w.is_archived ? '👁️ Hiện lại' : '📦 Ẩn (Lưu trữ)' }}
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
      }

      <!-- ============================================================== -->
      <!-- SECTION 2: CATEGORIES MANAGEMENT (Full CRUD + FK 23503 Rule)   -->
      <!-- ============================================================== -->
      @if (section() === 'CATEGORIES') {
        <div class="space-y-4">
          <div class="toy-card-lg p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
                🏷️ Quản lý Danh mục Thu / Chi
              </h2>
              <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
                Phân loại Thu / Chi, chọn màu sticker và bật cờ "Có thể trả hàng (Refundable)" cho Mua sắm
              </p>
            </div>
            <button
              type="button"
              (click)="openCategoryModal()"
              class="toy-btn px-5 py-2.5 bg-[#FF8FAB] text-[#2D2A32] text-sm font-extrabold shrink-0"
            >
              + Thêm danh mục
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Expense Categories -->
            <div class="toy-card p-5 bg-white space-y-3">
              <h3 class="font-display font-extrabold text-lg text-[#BE123C] flex items-center gap-2">
                <span>🛒 Danh mục Khoản Chi (EXPENSE)</span>
              </h3>
              <div class="space-y-2.5">
                @for (c of getCategoriesByType('EXPENSE'); track c.id) {
                  <div
                    class="p-3 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-between gap-2 bg-[#FFFDF5]"
                    [class.opacity-55]="c.is_archived"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span
                        class="w-10 h-10 rounded-xl border-2 border-[#2D2A32] flex items-center justify-center text-xl shrink-0"
                        [style.backgroundColor]="c.color"
                      >
                        {{ c.icon || '🛍️' }}
                      </span>
                      <div class="min-w-0">
                        <div class="font-display font-extrabold text-base text-[#2D2A32] truncate flex items-center gap-1.5">
                          <span>{{ c.name }}</span>
                          @if (c.is_archived) {
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 border border-[#2D2A32]">Đã ẩn</span>
                          }
                        </div>
                        @if (c.is_refundable) {
                          <span class="inline-block text-[11px] font-extrabold text-[#0369A1]">
                            ↩️ Hỗ trợ Trả hàng / Hoàn tiền
                          </span>
                        }
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        (click)="openCategoryModal(c)"
                        class="toy-btn px-2.5 py-1 bg-white text-xs"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        (click)="toggleArchiveCategory(c)"
                        class="toy-btn px-2.5 py-1 bg-[#E0F2FE] text-xs"
                        title="Ẩn / Hiện"
                      >
                        {{ c.is_archived ? '👁️' : '📦' }}
                      </button>
                      <button
                        type="button"
                        (click)="onDeleteCategory(c)"
                        class="toy-btn px-2.5 py-1 bg-[#FFE4E6] text-xs"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Income Categories -->
            <div class="toy-card p-5 bg-white space-y-3">
              <h3 class="font-display font-extrabold text-lg text-[#15803D] flex items-center gap-2">
                <span>🌾 Danh mục Khoản Thu (INCOME)</span>
              </h3>
              <div class="space-y-2.5">
                @for (c of getCategoriesByType('INCOME'); track c.id) {
                  <div
                    class="p-3 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-between gap-2 bg-[#FFFDF5]"
                    [class.opacity-55]="c.is_archived"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span
                        class="w-10 h-10 rounded-xl border-2 border-[#2D2A32] flex items-center justify-center text-xl shrink-0"
                        [style.backgroundColor]="c.color"
                      >
                        {{ c.icon || '🌾' }}
                      </span>
                      <div class="font-display font-extrabold text-base text-[#2D2A32] truncate flex items-center gap-1.5">
                        <span>{{ c.name }}</span>
                        @if (c.is_archived) {
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 border border-[#2D2A32]">Đã ẩn</span>
                        }
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        (click)="openCategoryModal(c)"
                        class="toy-btn px-2.5 py-1 bg-white text-xs"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        (click)="toggleArchiveCategory(c)"
                        class="toy-btn px-2.5 py-1 bg-[#E0F2FE] text-xs"
                        title="Ẩn / Hiện"
                      >
                        {{ c.is_archived ? '👁️' : '📦' }}
                      </button>
                      <button
                        type="button"
                        (click)="onDeleteCategory(c)"
                        class="toy-btn px-2.5 py-1 bg-[#FFE4E6] text-xs"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- SECTION 3: FAMILY SETTINGS (invite_code, invite_locked, members)-->
      <!-- ============================================================== -->
      @if (section() === 'FAMILY') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Invite Code & Lock Card -->
          <div class="toy-card-lg p-6 bg-white space-y-5">
            <div class="flex items-center gap-3">
              <div
                class="w-14 h-14 rounded-2xl bg-[#FEF3C7] border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] flex items-center justify-center text-3xl"
              >
                🔑
              </div>
              <div>
                <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
                  Mật Mã Tổ Ấm (Invite Code)
                </h2>
                <p class="text-xs font-bold text-[#2D2A32]/75">
                  Gửi mã này cho Vợ/Chồng để đăng nhập vào chung 1 nhà
                </p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2A32] space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase text-[#2D2A32]/65">🏡 Tên Tổ Ấm:</span>
                <span class="font-display font-extrabold text-base text-[#2D2A32]">
                  {{ familyService.currentFamily()?.name || '---' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase text-[#2D2A32]/65">💑 Biệt danh của bạn:</span>
                <span class="font-display font-extrabold text-base text-[#0369A1]">
                  {{ familyService.currentMembership()?.nickname || '---' }}
                  ({{ familyService.currentMembership()?.role }})
                </span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#FFF9EC] border-2 border-[#2D2A32] flex items-center justify-between gap-3">
              <div>
                <div class="text-xs font-extrabold uppercase text-[#2D2A32]/65">
                  Mã mời gia đình hiện tại:
                </div>
                <div class="font-display font-extrabold text-3xl tracking-widest text-[#BE123C] mt-0.5 select-all">
                  {{ familyService.currentFamily()?.invite_code || '------' }}
                </div>
              </div>

              <button
                type="button"
                (click)="copyInviteCode()"
                class="toy-btn px-4 py-2.5 bg-[#FFB020] text-[#2D2A32] text-sm font-extrabold"
              >
                📋 Copy mã
              </button>
            </div>

            <!-- ONLY OWNER SEES invite_locked TOGGLE -->
            @if (familyService.isOwner()) {
              <div
                (click)="onToggleInviteLock()"
                class="p-4 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                [ngClass]="
                  familyService.currentFamily()?.invite_locked
                    ? 'bg-[#FFE4E6]'
                    : 'bg-[#DCFCE7]'
                "
              >
                <div>
                  <div class="font-display font-extrabold text-base text-[#2D2A32] flex items-center gap-1.5">
                    <span>
                      {{
                        familyService.currentFamily()?.invite_locked
                          ? '🔒 Đang KHÓA mã mời gia đình'
                          : '🔓 Đang MỞ cửa đón thành viên'
                      }}
                    </span>
                  </div>
                  <div class="text-xs font-semibold text-[#2D2A32]/75 mt-0.5">
                    Khi đã đủ 2 vợ chồng trong nhà, Chủ hộ (OWNER) nên gạt khóa lại để không ai lạ vào được két sắt!
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  [attr.aria-checked]="familyService.currentFamily()?.invite_locked"
                  class="w-14 h-8 rounded-full border-2 border-[#2D2A32] p-0.5 transition-colors relative shrink-0 cursor-pointer"
                  [ngClass]="
                    familyService.currentFamily()?.invite_locked
                      ? 'bg-[#FF5C6C]'
                      : 'bg-white'
                  "
                >
                  <span
                    class="block w-6 h-6 rounded-full bg-[#2D2A32] transition-transform"
                    [class.translate-x-6]="familyService.currentFamily()?.invite_locked"
                  ></span>
                </button>
              </div>
            } @else {
              <div class="p-3.5 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2A32] text-xs font-bold text-[#2D2A32]/75">
                ℹ️ Trạng thái mã mời:
                <strong>
                  {{
                    familyService.currentFamily()?.invite_locked
                      ? '🔒 Đã được Chủ hộ khóa an toàn'
                      : '🔓 Đang mở'
                  }}
                </strong>
                (Chỉ OWNER mới có quyền gạt khóa/mở mã mời).
              </div>
            }
          </div>

          <!-- Family Members List Card -->
          <div class="toy-card-lg p-6 bg-white space-y-4">
            <div class="flex items-center gap-3">
              <div
                class="w-14 h-14 rounded-2xl bg-[#E0F2FE] border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32] flex items-center justify-center text-3xl"
              >
                👨‍👩‍👧
              </div>
              <div>
                <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
                  Thành Viên Trong Tổ Ấm
                </h2>
                <p class="text-xs font-bold text-[#2D2A32]/75">
                  Danh sách tài khoản đang cùng kết nối Realtime
                </p>
              </div>
            </div>

            <div class="space-y-3">
              @for (m of familyService.members(); track m.user_id) {
                <div class="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2A32] flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-11 h-11 rounded-2xl border-2 border-[#2D2A32] flex items-center justify-center text-2xl"
                      [ngClass]="m.role === 'OWNER' ? 'bg-[#FEF3C7]' : 'bg-[#FFE4E6]'"
                    >
                      {{ m.role === 'OWNER' ? '👑' : '💑' }}
                    </div>
                    <div>
                      <div class="font-display font-extrabold text-base text-[#2D2A32]">
                        {{ m.nickname }}
                      </div>
                      <div class="text-xs font-bold text-[#2D2A32]/65">
                        Tham gia: {{ m.joined_at | slice: 0 : 10 }}
                      </div>
                    </div>
                  </div>

                  <span
                    class="px-3 py-1 rounded-full border-2 border-[#2D2A32] font-display font-extrabold text-xs"
                    [ngClass]="
                      m.role === 'OWNER'
                        ? 'bg-[#FFB020] text-[#2D2A32]'
                        : 'bg-[#E0F2FE] text-[#0369A1]'
                    "
                  >
                    {{ m.role }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- WALLET CREATE/EDIT MODAL -->
      @if (walletModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A32]/60 backdrop-blur-xs"
          (click)="walletModalOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                {{ editingWallet() ? '✏️ Sửa thông tin Ví' : '💳 Thêm Ví / Nguồn tiền mới' }}
              </h3>
              <button
                type="button"
                (click)="walletModalOpen.set(false)"
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
                  placeholder="VD: TPBank Vợ, VietinBank Chồng, Ví MoMo, Tiền mặt..."
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
                <input
                  type="text"
                  inputmode="numeric"
                  name="walletInitialDisplay"
                  [ngModel]="walletInitialDisplay()"
                  (ngModelChange)="walletInitialDisplay.set(formatVnd($event))"
                  placeholder="0"
                  class="toy-input money-num text-xl font-extrabold bg-white"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="walletModalOpen.set(false)"
                  class="toy-btn px-4 py-2 bg-white text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  [disabled]="submitting()"
                  class="toy-btn px-5 py-2 bg-[#22C55E] text-white text-sm font-extrabold"
                >
                  {{ submitting() ? '⏳ Đang lưu...' : '💾 Lưu Ví' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- CATEGORY CREATE/EDIT MODAL -->
      @if (categoryModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A32]/60 backdrop-blur-xs"
          (click)="categoryModalOpen.set(false)"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] space-y-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2A32]/20">
              <h3 class="font-display font-extrabold text-xl text-[#2D2A32]">
                {{ editingCategory() ? '✏️ Sửa Danh mục' : '🏷️ Thêm Danh mục mới' }}
              </h3>
              <button
                type="button"
                (click)="categoryModalOpen.set(false)"
                class="toy-btn px-2.5 py-1 bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="onSaveCategory()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Phân loại *
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="catType.set('EXPENSE')"
                    class="toy-btn py-2 text-xs font-extrabold"
                    [ngClass]="
                      catType() === 'EXPENSE'
                        ? 'bg-[#FF5C6C] text-white'
                        : 'bg-white text-[#2D2A32]'
                    "
                  >
                    🛒 Khoản Chi (EXPENSE)
                  </button>
                  <button
                    type="button"
                    (click)="catType.set('INCOME')"
                    class="toy-btn py-2 text-xs font-extrabold"
                    [ngClass]="
                      catType() === 'INCOME'
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-white text-[#2D2A32]'
                    "
                  >
                    🌾 Khoản Thu (INCOME)
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  name="catName"
                  [ngModel]="catName()"
                  (ngModelChange)="onCategoryNameInput($event)"
                  placeholder="VD: Mua sắm Shopee, Ăn uống, Bỉm sữa, Tiền lương..."
                  required
                  class="toy-input bg-white"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Biểu tượng Sticker
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 rounded-xl border-2 border-[#2D2A32] bg-white">
                    @for (ic of emojiChoices; track ic) {
                      <button
                        type="button"
                        (click)="catIcon.set(ic)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-pointer"
                        [ngClass]="catIcon() === ic ? 'bg-[#FFB020] border border-[#2D2A32]' : 'hover:bg-[#FFF9EC]'"
                      >
                        {{ ic }}
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-extrabold uppercase text-[#2D2A32]/75 mb-1">
                    Màu sắc Kẹo ngọt
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 rounded-xl border-2 border-[#2D2A32] bg-white">
                    @for (clr of colorChoices; track clr) {
                      <button
                        type="button"
                        (click)="catColor.set(clr)"
                        class="w-7 h-7 rounded-full border-2 border-[#2D2A32] cursor-pointer"
                        [style.backgroundColor]="clr"
                        [class.scale-110]="catColor() === clr"
                      ></button>
                    }
                  </div>
                </div>
              </div>

              @if (catType() === 'EXPENSE') {
                <label
                  class="flex items-center justify-between p-3 rounded-2xl border-2 border-[#2D2A32] bg-[#E0F2FE]/60 cursor-pointer select-none"
                >
                  <div>
                    <div class="font-display font-extrabold text-sm text-[#2D2A32]">
                      Cho phép Trả hàng / Hoàn tiền (is_refundable)?
                    </div>
                    <div class="text-xs font-semibold text-[#2D2A32]/75">
                      Mặc định tự động bật cho danh mục "Mua sắm"
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="catRefundable"
                    [ngModel]="catRefundable()"
                    (ngModelChange)="catRefundable.set($event)"
                    class="w-5 h-5 accent-[#FF8FAB] rounded cursor-pointer"
                  />
                </label>
              }

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="categoryModalOpen.set(false)"
                  class="toy-btn px-4 py-2 bg-white text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  [disabled]="submitting()"
                  class="toy-btn px-5 py-2 bg-[#FF8FAB] text-[#2D2A32] text-sm font-extrabold"
                >
                  {{ submitting() ? '⏳ Đang lưu...' : '💾 Lưu Danh mục' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class SettingsComponent {
  readonly walletService = inject(WalletService);
  readonly categoryService = inject(CategoryService);
  readonly familyService = inject(FamilyService);
  private readonly toast = inject(ToastService);

  readonly ownerMeta = OWNER_SCOPE_META;
  readonly walletTypeMeta = WALLET_TYPE_META;

  readonly section = signal<'WALLETS' | 'CATEGORIES' | 'FAMILY'>('FAMILY');
  readonly submitting = signal<boolean>(false);

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

  // Wallet Form Signals
  readonly walletModalOpen = signal<boolean>(false);
  readonly editingWallet = signal<WalletWithBalance | null>(null);
  readonly walletName = signal<string>('');
  readonly walletOwner = signal<OwnerScope>('SHARED');
  readonly walletType = signal<WalletType>('BANK');
  readonly walletInitialDisplay = signal<string>('0');

  // Category Form Signals
  readonly categoryModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly catName = signal<string>('');
  readonly catType = signal<CategoryType>('EXPENSE');
  readonly catIcon = signal<string>('🛍️');
  readonly catColor = signal<string>('#FF8FAB');
  readonly catRefundable = signal<boolean>(false);

  formatVnd(val: string): string {
    return formatVndInput(val);
  }

  getCategoriesByType(type: CategoryType): Category[] {
    return this.categoryService.categories().filter((c) => c.type === type);
  }

  // --- Wallet CRUD ---
  openWalletModal(w?: WalletWithBalance): void {
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
    this.walletModalOpen.set(true);
  }

  openWalletPreset(preset: {
    name: string;
    type: WalletType;
    scope: OwnerScope;
  }): void {
    this.editingWallet.set(null);
    this.walletName.set(preset.name);
    this.walletType.set(preset.type);
    this.walletOwner.set(preset.scope);
    this.walletInitialDisplay.set('0');
    this.walletModalOpen.set(true);
  }

  async onSaveWallet(): Promise<void> {
    if (!this.walletName().trim()) {
      this.toast.show('warning', 'Thiếu tên ví! 💳', 'Hãy nhập tên ví hoặc ngân hàng.');
      return;
    }

    this.submitting.set(true);
    try {
      const initial = parseVndInput(this.walletInitialDisplay());
      const edit = this.editingWallet();
      if (edit) {
        await this.walletService.updateWallet(edit.id, {
          name: this.walletName(),
          owner_scope: this.walletOwner(),
          wallet_type: this.walletType(),
          initial_balance: initial,
        });
        this.toast.show('success', 'Đã cập nhật ví! ✨', 'Thông tin ví đã được lưu.');
      } else {
        await this.walletService.createWallet({
          name: this.walletName(),
          owner_scope: this.walletOwner(),
          wallet_type: this.walletType(),
          initial_balance: initial,
        });
        this.toast.show('success', 'Đã thêm ví mới! 💳', `Ví "${this.walletName()}" đã sẵn sàng.`);
      }
      this.walletModalOpen.set(false);
    } catch (err: any) {
      this.toast.show('error', 'Không thể lưu ví! 🚨', err?.message || 'Vui lòng thử lại.');
    } finally {
      this.submitting.set(false);
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
      // Friendly Vietnamese error message when code === '23503' (Foreign Key protection)
      this.toast.show(
        'warning',
        'Không thể xóa ví này! 🛡️',
        err?.message ||
          'Không thể xóa vì đã có giao dịch gắn với mục này. Bạn có thể chọn Ẩn (Lưu trữ) thay thế.',
        7000
      );
    }
  }

  // --- Category CRUD ---
  openCategoryModal(c?: Category): void {
    if (c) {
      this.editingCategory.set(c);
      this.catName.set(c.name);
      this.catType.set(c.type);
      this.catIcon.set(c.icon || '🛍️');
      this.catColor.set(c.color || '#FF8FAB');
      this.catRefundable.set(Boolean(c.is_refundable));
    } else {
      this.editingCategory.set(null);
      this.catName.set('');
      this.catType.set('EXPENSE');
      this.catIcon.set('🛍️');
      this.catColor.set('#FF8FAB');
      this.catRefundable.set(false);
    }
    this.categoryModalOpen.set(true);
  }

  onCategoryNameInput(val: string): void {
    this.catName.set(val);
    // Automatically tick is_refundable if name contains "Mua sắm"
    if (
      !this.editingCategory() &&
      this.catType() === 'EXPENSE' &&
      val.toLowerCase().includes('mua sắm')
    ) {
      this.catRefundable.set(true);
    }
  }

  async onSaveCategory(): Promise<void> {
    if (!this.catName().trim()) {
      this.toast.show('warning', 'Thiếu tên danh mục! 🏷️', 'Hãy nhập tên danh mục.');
      return;
    }

    this.submitting.set(true);
    try {
      const edit = this.editingCategory();
      if (edit) {
        await this.categoryService.updateCategory(edit.id, {
          name: this.catName(),
          type: this.catType(),
          icon: this.catIcon(),
          color: this.catColor(),
          is_refundable:
            this.catType() === 'EXPENSE' ? this.catRefundable() : false,
        });
        this.toast.show('success', 'Đã cập nhật danh mục! ✨', 'Danh mục đã được lưu.');
      } else {
        await this.categoryService.createCategory({
          name: this.catName(),
          type: this.catType(),
          icon: this.catIcon(),
          color: this.catColor(),
          is_refundable:
            this.catType() === 'EXPENSE' ? this.catRefundable() : false,
        });
        this.toast.show(
          'success',
          'Đã thêm danh mục! 🏷️',
          `Danh mục "${this.catName()}" đã sẵn sàng.`
        );
      }
      this.categoryModalOpen.set(false);
    } catch (err: any) {
      this.toast.show('error', 'Không thể lưu danh mục! 🚨', err?.message || 'Vui lòng thử lại.');
    } finally {
      this.submitting.set(false);
    }
  }

  async toggleArchiveCategory(c: Category): Promise<void> {
    try {
      await this.categoryService.updateCategory(c.id, {
        is_archived: !c.is_archived,
      });
      this.toast.show(
        'info',
        c.is_archived ? 'Đã hiện lại danh mục! 👁️' : 'Đã ẩn (lưu trữ) danh mục! 📦',
        `Danh mục "${c.name}" đã được cập nhật.`
      );
    } catch (err: any) {
      this.toast.show('error', 'Lỗi cập nhật! 🚨', err?.message || 'Vui lòng thử lại.');
    }
  }

  async onDeleteCategory(c: Category): Promise<void> {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${c.name}" không?`)) return;
    try {
      await this.categoryService.deleteCategory(c.id);
      this.toast.show('info', 'Đã xóa danh mục! 🗑️', `Danh mục "${c.name}" đã được xóa.`);
    } catch (err: any) {
      // Friendly Vietnamese error message when code === '23503' (Foreign Key protection)
      this.toast.show(
        'warning',
        'Không thể xóa danh mục này! 🛡️',
        err?.message ||
          'Không thể xóa vì đã có giao dịch gắn với mục này. Bạn có thể chọn Ẩn (Lưu trữ) thay thế.',
        7000
      );
    }
  }

  // --- Family Settings ---
  async copyInviteCode(): Promise<void> {
    const code = this.familyService.currentFamily()?.invite_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.toast.show(
        'success',
        'Đã copy Mã Tổ Ấm! 📋',
        `Mã "${code}" đã lưu vào clipboard, gửi ngay cho nửa kia nhé!`
      );
    } catch {
      this.toast.show('info', 'Mã mời của bạn:', code);
    }
  }

  async onToggleInviteLock(): Promise<void> {
    if (!this.familyService.isOwner()) return;
    const currentLocked = Boolean(
      this.familyService.currentFamily()?.invite_locked
    );
    try {
      await this.familyService.toggleInviteLock(!currentLocked);
      this.toast.show(
        'success',
        !currentLocked ? 'Đã khóa mã mời! 🔒' : 'Đã mở khóa mã mời! 🔓',
        !currentLocked
          ? 'Không ai có thể dùng mã mời để vào gia đình nữa.'
          : 'Thành viên mới có thể nhập mã để tham gia gia đình.'
      );
    } catch (err: any) {
      this.toast.show('error', 'Không thể đổi trạng thái khóa! 🚨', err?.message || 'Vui lòng thử lại.');
    }
  }
}
