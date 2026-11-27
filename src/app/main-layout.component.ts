import {
  Component,
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FamilyService } from './core/services/family.service';
import { AuthService } from './core/services/auth.service';
import { DataSyncService } from './core/services/data-sync.service';
import { WalletService } from './core/services/wallet.service';
import { ToastService } from './core/services/toast.service';
import { VoiceInputService } from './core/services/voice-input.service';
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
        <div class="space-y-6">
          <!-- Brand Logo Sticker -->
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-[#2D2A32] shadow-[0_4px_0_#2D2A32]">
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
            <div class="money-num text-xs font-extrabold text-[#15803D]">
              Két sắt: {{ walletService.totalBalance() | vnd }}
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
          <button
            type="button"
            (click)="logout()"
            class="toy-btn px-2 py-1.5 bg-white text-xs"
            title="Đăng xuất"
          >
            🚪
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

          <!-- CENTER FLOATING '+' SQUISHY BUTTON (Tap = Quick Expense, Hold = Live Voice Overlay -> Release opens Modal) -->
          <div class="flex items-center justify-center relative -top-5">
            <button
              type="button"
              (pointerdown)="onPlusButtonPointerDown($event)"
              (click)="onPlusButtonClick($event)"
              (contextmenu)="$event.preventDefault()"
              class="w-15 h-15 rounded-full border-3 border-[#2D2A32] shadow-[0_5px_0_#2D2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-3xl font-display font-extrabold text-[#2D2A32] transition-all cursor-pointer select-none touch-none"
              [ngClass]="
                liveVoiceOverlayOpen() || holdingPlusBtn()
                  ? 'bg-[#FF5C6C] text-white scale-110 animate-pulse'
                  : 'bg-[#FFB020] active:bg-[#FF8FAB]'
              "
              aria-label="Bấm để thêm khoản chi • Nhấn giữ để thu âm nhập nhanh"
              title="Bấm: Thêm khoản chi • Nhấn giữ: Thu âm trực tiếp, thả tay mở sổ 🎙️"
            >
              {{ liveVoiceOverlayOpen() ? '🎙️' : '＋' }}
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

      <!-- LIVE VOICE OVERLAY POPUP (Hiện khi đang nhấn giữ nút '+', làm mờ phần còn lại, chạy chữ trực tiếp) -->
      @if (liveVoiceOverlayOpen()) {
        <div
          class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D2A32]/70 backdrop-blur-md select-none"
        >
          <div
            class="toy-card-lg w-full max-w-md p-6 bg-[#FFFDF5] text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <!-- Top Badge -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFE4E6] border-2 border-[#2D2A32] text-[#BE123C] font-display font-extrabold text-xs">
              <span class="w-2.5 h-2.5 rounded-full bg-[#FF5C6C] animate-ping"></span>
              <span>ĐANG THU ÂM KHOẢN CHI NHANH</span>
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
                  Hãy nói tên món + số tiền...
                </p>
                <p class="text-xs font-bold text-[#2D2A32]/45 mt-1">
                  VD: "Ăn phở bò 55 nghìn", "Bỉm sữa Shopee 250k"
                </p>
              }
            </div>

            <!-- Real-time Parsed Preview Pills -->
            <div class="grid grid-cols-2 gap-2.5 text-left">
              <div class="p-2.5 rounded-xl bg-[#FFF9EC] border-2 border-[#2D2A32]">
                <div class="text-[10px] font-extrabold uppercase text-[#2D2A32]/60">
                  🛒 Mua gì
                </div>
                <div class="font-display font-extrabold text-sm text-[#2D2A32] truncate mt-0.5">
                  {{ liveVoiceParsed().title || 'Đang chờ...' }}
                </div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#FFE4E6]/60 border-2 border-[#2D2A32]">
                <div class="text-[10px] font-extrabold uppercase text-[#2D2A32]/60">
                  💸 Số tiền
                </div>
                <div class="money-num font-extrabold text-sm text-[#BE123C] truncate mt-0.5">
                  {{ liveVoiceParsed().amount ? (liveVoiceParsed().amount | vnd) : '0 ₫' }}
                </div>
              </div>
            </div>

            <div class="pt-1">
              <div class="text-xs font-extrabold text-[#2D2A32]/75">
                ✨ Thả tay ra để mở sổ chi tiêu với thông tin trên
              </div>
              <button
                type="button"
                (click)="finishLiveVoiceAndOpenModal()"
                class="mt-2 px-4 py-1.5 rounded-xl border-2 border-[#2D2A32] bg-[#FFB020] text-[#2D2A32] font-display font-extrabold text-xs cursor-pointer"
              >
                ✅ Mở form ngay
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Global Quick Add Transaction Modal -->
      <app-transaction-form-modal
        [isOpen]="dataSync.quickTransactionModalOpen()"
        [defaultType]="dataSync.quickTransactionDefaultType()"
        [voicePrefill]="dataSync.quickTransactionVoicePrefill()"
        [editTransaction]="null"
        (closed)="dataSync.closeQuickAdd()"
      />
    </div>
  `,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly familyService = inject(FamilyService);
  readonly authService = inject(AuthService);
  readonly dataSync = inject(DataSyncService);
  readonly walletService = inject(WalletService);
  private readonly voiceInput = inject(VoiceInputService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly holdingPlusBtn = signal<boolean>(false);
  readonly liveVoiceOverlayOpen = signal<boolean>(false);
  readonly liveVoiceTranscript = signal<string>('');
  readonly liveVoiceParsed = computed(() =>
    this.voiceInput.parseSmartVoiceTransaction(this.liveVoiceTranscript())
  );

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private finalizeTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;
  private isFinishingVoice = false;

  private readonly boundGlobalRelease = () => this.onGlobalPointerRelease();

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

  ngOnDestroy(): void {
    this.clearHoldTimer();
    this.removeGlobalReleaseListeners();
  }

  onPlusButtonPointerDown(_event: PointerEvent): void {
    this.clearHoldTimer();
    this.longPressTriggered = false;
    this.isFinishingVoice = false;
    this.holdingPlusBtn.set(true);
    this.attachGlobalReleaseListeners();

    // Hold ~650ms opens the Live Voice Overlay Popup (without opening the form modal yet)
    this.holdTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.holdingPlusBtn.set(false);
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
      this.dataSync.openQuickAdd('EXPENSE');
      this.cdr.detectChanges();
    }
  }

  private onGlobalPointerRelease(): void {
    this.clearHoldTimer();
    this.holdingPlusBtn.set(false);
    this.removeGlobalReleaseListeners();

    if (this.longPressTriggered && this.liveVoiceOverlayOpen()) {
      this.finishLiveVoiceAndOpenModal();
    }
  }

  finishLiveVoiceAndOpenModal(): void {
    if (this.isFinishingVoice) return;
    this.isFinishingVoice = true;
    this.removeGlobalReleaseListeners();

    // Wait 320ms grace buffer to capture the last spoken syllable after finger release
    this.voiceInput.stopListening(250);
    if (this.finalizeTimer) clearTimeout(this.finalizeTimer);
    this.finalizeTimer = setTimeout(() => {
      const parsed = this.liveVoiceParsed();
      this.liveVoiceOverlayOpen.set(false);
      this.isFinishingVoice = false;
      this.dataSync.openQuickAdd(
        'EXPENSE',
        parsed.rawText ? parsed : null
      );
      this.cdr.detectChanges();
    }, 320);
  }

  onPlusButtonClick(event: MouseEvent): void {
    if (this.longPressTriggered) {
      event.preventDefault();
      event.stopPropagation();
      this.longPressTriggered = false;
      return;
    }
    this.dataSync.openQuickAdd('EXPENSE', null);
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

  async logout(): Promise<void> {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi két sắt tổ ấm không?')) {
      return;
    }
    await this.authService.signOut();
    this.familyService.clearState();
    await this.router.navigate(['/auth']);
  }
}
