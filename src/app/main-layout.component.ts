import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FamilyService } from './core/services/family.service';
import { AuthService } from './core/services/auth.service';
import { DataSyncService } from './core/services/data-sync.service';
import { WalletService } from './core/services/wallet.service';
import { ToastService } from './core/services/toast.service';
import { TransactionFormModalComponent } from './shared/components/transaction-form-modal.component';
import { VndPipe } from './shared/pipes/vnd.pipe';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TransactionFormModalComponent,
    VndPipe,
  ],
  template: `
    <div class="min-h-dvh flex flex-col md:flex-row">
      <!-- DESKTOP SIDEBAR (>= 768px) -->
      <aside
        class="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-[#FFF9EC] border-r-3 border-[#2D2A32] p-5 z-30 justify-between"
      >
        <div class="space-y-5">
          <!-- Brand Logo Sticker + Persistent Invite Code Box -->
          <div class="p-3.5 rounded-2xl bg-white border-2 border-[#2D2A32] shadow-[0_4px_0_#2D2A32] space-y-2.5">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-[#FF8FAB] border-2 border-[#2D2A32] flex items-center justify-center text-2xl shrink-0"
              >
                🐷
              </div>
              <div class="min-w-0">
                <h1 class="font-display font-extrabold text-xl text-[#2D2A32] truncate leading-tight">
                  {{ familyService.currentFamily()?.name || 'FamilyFinance' }}
                </h1>
                <div class="flex items-center gap-1.5 text-xs font-extrabold text-[#15803D]">
                  <span class="w-2 h-2 rounded-full bg-[#22C55E] animate-ping"></span>
                  <span>{{ familyService.members().length }} thành viên kết nối</span>
                </div>
              </div>
            </div>

            <!-- Always-visible Invite Code Pill on Sidebar -->
            <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#FFF9EC] border-2 border-[#2D2A32]">
              <div class="min-w-0">
                <div class="text-[10px] font-extrabold uppercase text-[#2D2A32]/65">
                  🔑 Mã mời gia đình
                </div>
                <div class="font-display font-extrabold text-sm tracking-widest text-[#BE123C] select-all">
                  {{ familyService.currentFamily()?.invite_code || '---' }}
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="copyInviteCode()"
                  class="px-2 py-1 rounded-lg bg-[#FFB020] hover:bg-[#FFA000] border border-[#2D2A32] font-display font-extrabold text-xs cursor-pointer"
                  title="Copy mã mời"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Add Buttons (+ Ting ting lúa về | - Lại chốt đơn) -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="dataSync.openQuickAdd('INCOME')"
              class="toy-btn py-2.5 px-2 bg-[#22C55E] text-white text-xs font-extrabold"
            >
              + Ting ting lúa về
            </button>
            <button
              type="button"
              (click)="dataSync.openQuickAdd('EXPENSE')"
              class="toy-btn py-2.5 px-2 bg-[#FF5C6C] text-white text-xs font-extrabold"
            >
              - Lại chốt đơn
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="space-y-2.5">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-[#FFB020] shadow-[0_4px_0_#2D2A32] -translate-y-0.5"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-[#2D2A32] bg-white hover:bg-[#FEF3C7] font-display font-extrabold text-base text-[#2D2A32] transition-all"
              >
                <span class="text-2xl">{{ item.emoji }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>

        <!-- Bottom Total Wallet Card & Member Badge -->
        <div class="space-y-3">
          <div class="p-3.5 rounded-2xl bg-white border-2 border-[#2D2A32] shadow-[0_3px_0_#2D2A32]">
            <div class="text-xs font-extrabold uppercase text-[#2D2A32]/70">
              💰 Tổng két sắt hiện có
            </div>
            <div class="money-num font-extrabold text-xl text-[#15803D] mt-0.5">
              {{ walletService.totalBalance() | vnd }}
            </div>
          </div>

          <div class="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/80 border-2 border-[#2D2A32]">
            <div class="min-w-0">
              <div class="font-display font-extrabold text-sm text-[#2D2A32] truncate">
                {{ familyService.currentMembership()?.nickname || 'Thành viên' }}
              </div>
              <div class="text-[11px] font-bold text-[#2D2A32]/65 truncate">
                {{ familyService.isOwner() ? '👑 Chủ hộ (OWNER)' : '💑 Thành viên (MEMBER)' }}
              </div>
            </div>
            <button
              type="button"
              (click)="logout()"
              class="toy-btn px-2.5 py-1.5 bg-[#FFE4E6] text-xs"
              title="Đăng xuất"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <!-- MOBILE TOP HEADER (< 768px) -->
      <header
        class="md:hidden sticky top-0 z-30 bg-[#FFF9EC]/95 backdrop-blur-xs border-b-2 border-[#2D2A32] px-4 py-2.5 flex items-center justify-between"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-10 h-10 rounded-2xl bg-[#FF8FAB] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32] flex items-center justify-center text-xl shrink-0"
          >
            🐷
          </div>
          <div class="min-w-0">
            <h1 class="font-display font-extrabold text-base text-[#2D2A32] truncate leading-tight">
              {{ familyService.currentFamily()?.name || 'FamilyFinance' }}
            </h1>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="money-num text-xs font-extrabold text-[#15803D]">
                {{ walletService.totalBalance() | vnd }}
              </span>
              <button
                type="button"
                (click)="copyInviteCode()"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#2D2A32] text-[10px] font-extrabold text-[#B45309] cursor-pointer"
                title="Bấm để copy mã mời gia đình"
              >
                🔑 Mã: {{ familyService.currentFamily()?.invite_code }} 📋
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            (click)="dataSync.openQuickAdd('INCOME')"
            class="toy-btn px-2.5 py-1.5 bg-[#DCFCE7] text-[#15803D] text-xs font-extrabold"
          >
            + Thu
          </button>
          <button
            type="button"
            (click)="dataSync.openQuickAdd('EXPENSE')"
            class="toy-btn px-2.5 py-1.5 bg-[#FFE4E6] text-[#BE123C] text-xs font-extrabold"
          >
            - Chi
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT AREA -->
      <main class="flex-1 md:pl-72 pb-28 md:pb-10">
        <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- MOBILE BOTTOM NAVIGATION BAR (< 768px) + CENTER FLOATING '+' BUTTON -->
      <nav
        class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFF9EC] border-t-3 border-[#2D2A32] px-2 pb-[env(safe-area-inset-bottom)]"
      >
        <div class="grid grid-cols-5 items-center h-16 relative">
          <!-- Tab 1: Dashboard -->
          <a
            routerLink="/dashboard"
            routerLinkActive="text-[#BE123C] scale-105"
            class="flex flex-col items-center justify-center py-1 font-display font-extrabold text-[11px] text-[#2D2A32]"
          >
            <span class="text-xl leading-none">📊</span>
            <span class="mt-0.5">Tổng quan</span>
          </a>

          <!-- Tab 2: Transactions -->
          <a
            routerLink="/transactions"
            routerLinkActive="text-[#BE123C] scale-105"
            class="flex flex-col items-center justify-center py-1 font-display font-extrabold text-[11px] text-[#2D2A32]"
          >
            <span class="text-xl leading-none">📒</span>
            <span class="mt-0.5">Thu / Chi</span>
          </a>

          <!-- CENTER FLOATING '+' SQUISHY BUTTON -->
          <div class="flex items-center justify-center relative -top-5">
            <button
              type="button"
              (click)="dataSync.openQuickAdd('EXPENSE')"
              class="w-15 h-15 rounded-full bg-[#FFB020] active:bg-[#FF8FAB] border-3 border-[#2D2A32] shadow-[0_5px_0_#2D2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-3xl font-display font-extrabold text-[#2D2A32] transition-all cursor-pointer"
              aria-label="Thêm giao dịch nhanh"
            >
              ＋
            </button>
          </div>

          <!-- Tab 3: Debts & Loans -->
          <a
            routerLink="/debts-loans"
            routerLinkActive="text-[#BE123C] scale-105"
            class="flex flex-col items-center justify-center py-1 font-display font-extrabold text-[11px] text-[#2D2A32]"
          >
            <span class="text-xl leading-none">🤝</span>
            <span class="mt-0.5">Mượn / Nợ</span>
          </a>

          <!-- Tab 4: Wallets, Categories & Family Settings -->
          <a
            routerLink="/settings"
            routerLinkActive="text-[#BE123C] scale-105"
            class="flex flex-col items-center justify-center py-1 font-display font-extrabold text-[11px] text-[#2D2A32]"
          >
            <span class="text-xl leading-none">🏡</span>
            <span class="mt-0.5">Ví & Nhà</span>
          </a>
        </div>
      </nav>

      <!-- Global Quick Add Transaction Modal -->
      <app-transaction-form-modal
        [isOpen]="dataSync.quickTransactionModalOpen()"
        [defaultType]="dataSync.quickTransactionDefaultType()"
        [editTransaction]="null"
        (closed)="dataSync.closeQuickAdd()"
      />
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  readonly familyService = inject(FamilyService);
  readonly authService = inject(AuthService);
  readonly dataSync = inject(DataSyncService);
  readonly walletService = inject(WalletService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly navItems = [
    { route: '/dashboard', label: 'Bảng điều khiển', emoji: '📊' },
    { route: '/transactions', label: 'Sổ Thu / Chi', emoji: '📒' },
    { route: '/debts-loans', label: 'Cho mượn & Nợ', emoji: '🤝' },
    { route: '/settings', label: 'Gia đình, Ví & Danh mục', emoji: '🏡' },
  ];

  async copyInviteCode(): Promise<void> {
    const code = this.familyService.currentFamily()?.invite_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.toast.show(
        'success',
        'Đã copy Mã Tổ Ấm! 📋',
        `Mã mời "${code}" đã được copy. Gửi cho nửa kia nhập vào nhé!`
      );
    } catch {
      this.toast.show('info', 'Mã mời gia đình:', code);
    }
  }

  async ngOnInit(): Promise<void> {
    if (!this.familyService.hasFamily()) {
      const fam = await this.familyService.loadCurrentFamily();
      if (!fam) {
        await this.router.navigate(['/onboarding']);
        return;
      }
    }
    if (!this.dataSync.initialLoaded()) {
      await this.dataSync.loadAllFamilyData();
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.familyService.clearState();
    await this.router.navigate(['/auth']);
  }
}
