import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FamilyService } from '../../core/services/family.service';
import { AuthService } from '../../core/services/auth.service';
import { DataSyncService } from '../../core/services/data-sync.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-dvh flex flex-col justify-center p-4 sm:p-6 max-w-4xl mx-auto">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2.5">
          <span class="text-3xl">🏡🔑</span>
          <div>
            <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#2D2A32]">
              Nhập mật mã tổ ấm để mở két sắt nào!
            </h1>
            <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
              Xin chào <span class="text-[#BE123C]">{{ authService.user()?.email }}</span>! Chọn 1 trong 2 cách dưới đây nhé:
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="logout()"
          class="toy-btn px-3.5 py-2 bg-white text-xs font-extrabold"
        >
          🚪 Đăng xuất
        </button>
      </div>

      <!-- 2 Onboarding Cards: (1) Create New Family & (2) Join Family By Code -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- CARD 1: Tạo gia đình mới -->
        <div class="toy-card-lg p-6 bg-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#DCFCE7] border-2 border-[#2D2A32] flex items-center justify-center text-4xl">
            🏠
          </div>

          <div>
            <span
              class="inline-block px-3 py-1 rounded-full bg-[#DCFCE7] border-2 border-[#15803D] text-[#15803D] font-display font-extrabold text-xs mb-3"
            >
              LỰA CHỌN 1 • NGƯỜI KHỞI TẠO
            </span>
            <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
              Tạo Gia Đình Mới 🌱
            </h2>
            <p class="text-sm font-semibold text-[#2D2A32]/75 mt-1">
              Dành cho Vợ hoặc Chồng là người đầu tiên lập sổ. Hệ thống sẽ tự động tạo sẵn
              <strong>3 ví mặc định</strong> + <strong>5 danh mục cơ bản</strong> và cấp Mã Mời cho nửa kia!
            </p>

            <form (ngSubmit)="onCreateFamily()" class="mt-5 space-y-3.5">
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Tên Tổ Ấm của 2 vợ chồng *
                </label>
                <input
                  type="text"
                  name="familyName"
                  [ngModel]="familyName()"
                  (ngModelChange)="familyName.set($event)"
                  placeholder="VD: Tổ Ấm Nhà Gấu & Thỏ 🐻🐰"
                  required
                  class="toy-input"
                />
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Biệt danh của bạn trong nhà *
                </label>
                <input
                  type="text"
                  name="createNickname"
                  [ngModel]="createNickname()"
                  (ngModelChange)="createNickname.set($event)"
                  placeholder="VD: Nóc Nhà Quyền Lực 👑"
                  required
                  class="toy-input"
                />
              </div>

              <button
                type="submit"
                [disabled]="creating()"
                class="toy-btn w-full py-3.5 bg-[#22C55E] text-white text-base font-extrabold mt-2"
              >
                @if (creating()) {
                  <span>⏳ Đang xây tổ ấm...</span>
                } @else {
                  <span>✨ Xây Tổ Ấm & Nhận Mã Mời</span>
                }
              </button>
            </form>
          </div>
        </div>

        <!-- CARD 2: Nhập mã gia đình -->
        <div class="toy-card-lg p-6 bg-[#FFF9EC] flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#FEF3C7] border-2 border-[#2D2A32] flex items-center justify-center text-4xl">
            🔑
          </div>

          <div>
            <span
              class="inline-block px-3 py-1 rounded-full bg-[#FEF3C7] border-2 border-[#B45309] text-[#B45309] font-display font-extrabold text-xs mb-3"
            >
              LỰA CHỌN 2 • NỬA KIA ĐÃ TẠO NHÀ
            </span>
            <h2 class="font-display font-extrabold text-2xl text-[#2D2A32]">
              Nhập Mã Gia Đình 💌
            </h2>
            <p class="text-sm font-semibold text-[#2D2A32]/75 mt-1">
              Nếu Vợ/Chồng bạn đã tạo gia đình trước, hãy xin
              <strong>Mã Mời (Invite Code)</strong> để 2 tài khoản cùng quản lý chung 1 két sắt!
            </p>

            <form (ngSubmit)="onJoinFamily()" class="mt-5 space-y-3.5">
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Mật mã Tổ Ấm (Invite Code) *
                </label>
                <input
                  type="text"
                  name="inviteCode"
                  [ngModel]="inviteCode()"
                  (ngModelChange)="inviteCode.set($event)"
                  placeholder="VD: FAM-8899 hoặc 6-8 ký tự..."
                  required
                  class="toy-input uppercase tracking-widest font-display text-lg bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Biệt danh của bạn trong nhà *
                </label>
                <input
                  type="text"
                  name="joinNickname"
                  [ngModel]="joinNickname()"
                  (ngModelChange)="joinNickname.set($event)"
                  placeholder="VD: Chồng Ngoan Hiền 🐶"
                  required
                  class="toy-input bg-white"
                />
              </div>

              <button
                type="submit"
                [disabled]="joining()"
                class="toy-btn w-full py-3.5 bg-[#FFB020] text-[#2D2A32] text-base font-extrabold mt-2"
              >
                @if (joining()) {
                  <span>⏳ Đang khớp chìa khóa...</span>
                } @else {
                  <span>🔑 Mở Khóa Vào Chung Nhà!</span>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly dataSync = inject(DataSyncService);
  private readonly toast = inject(ToastService);
  private readonly confetti = inject(ConfettiService);
  private readonly router = inject(Router);

  readonly familyName = signal<string>('');
  readonly createNickname = signal<string>('');
  readonly inviteCode = signal<string>('');
  readonly joinNickname = signal<string>('');
  readonly creating = signal<boolean>(false);
  readonly joining = signal<boolean>(false);

  async onCreateFamily(): Promise<void> {
    if (!this.familyName().trim() || !this.createNickname().trim()) {
      this.toast.show('warning', 'Nhập đủ thông tin nha! 🏡', 'Hãy đặt tên tổ ấm và biệt danh của bạn.');
      return;
    }

    this.creating.set(true);
    try {
      const res = await this.familyService.createFamily(
        this.familyName(),
        this.createNickname()
      );
      await this.dataSync.loadAllFamilyData();
      this.confetti.celebrate();
      this.toast.show(
        'success',
        'Xây tổ ấm thành công! 🎉',
        `Mã mời gia đình bạn là: ${res?.invite_code || this.familyService.currentFamily()?.invite_code}`
      );
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không thể tạo gia đình! 🚨',
        err?.message || 'Vui lòng thử lại.'
      );
    } finally {
      this.creating.set(false);
    }
  }

  async onJoinFamily(): Promise<void> {
    if (!this.inviteCode().trim() || !this.joinNickname().trim()) {
      this.toast.show('warning', 'Thiếu mã mời rồi! 🔑', 'Hãy nhập mã gia đình và biệt danh của bạn.');
      return;
    }

    this.joining.set(true);
    try {
      await this.familyService.joinFamilyByCode(
        this.inviteCode(),
        this.joinNickname()
      );
      await this.dataSync.loadAllFamilyData();
      this.confetti.celebrate();
      this.toast.show(
        'success',
        'Chào mừng về chung một nhà! 🏡💖',
        'Dữ liệu chi tiêu của 2 vợ chồng đã được kết nối.'
      );
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.toast.show(
        'error',
        'Mã gia đình không hợp lệ hoặc đang khóa! 🚨',
        err?.message || 'Hãy kiểm tra lại mã mời từ nửa kia nhé.'
      );
    } finally {
      this.joining.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.familyService.clearState();
    await this.router.navigate(['/auth']);
  }
}
