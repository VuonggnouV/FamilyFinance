import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FamilyService } from '../../core/services/family.service';
import { DataSyncService } from '../../core/services/data-sync.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-dvh flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Cute Invitation Header Sticker -->
        <div class="text-center mb-6">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FF8FAB] border-3 border-[#2D2A32] shadow-[0_6px_0_#2D2A32] text-4xl animate-float mb-3"
          >
            🐷
          </div>
          <h1 class="font-display font-extrabold text-3xl sm:text-4xl text-[#2D2A32]">
            FamilyFinance
          </h1>
          <p class="text-sm font-bold text-[#2D2A32]/75 mt-1">
            Sổ tay heo đất thông minh cho 2 vợ chồng 🏡💖
          </p>
        </div>

        <!-- Card -->
        <div class="toy-card-lg p-6 sm:p-8 bg-white relative">
          <!-- Mode Tabs -->
          <div class="grid grid-cols-2 gap-2.5 p-1.5 bg-[#FFF9EC] rounded-2xl border-2 border-[#2D2A32] mb-6">
            <button
              type="button"
              (click)="mode.set('login')"
              class="py-2.5 rounded-xl font-display font-extrabold text-sm transition-all cursor-pointer"
              [ngClass]="
                mode() === 'login'
                  ? 'bg-[#FFB020] text-[#2D2A32] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                  : 'text-[#2D2A32]/70 hover:text-[#2D2A32]'
              "
            >
              🔑 Mở cửa vào nhà
            </button>
            <button
              type="button"
              (click)="mode.set('register')"
              class="py-2.5 rounded-xl font-display font-extrabold text-sm transition-all cursor-pointer"
              [ngClass]="
                mode() === 'register'
                  ? 'bg-[#FF8FAB] text-[#2D2A32] border-2 border-[#2D2A32] shadow-[0_2px_0_#2D2A32]'
                  : 'text-[#2D2A32]/70 hover:text-[#2D2A32]'
              "
            >
              ✨ Đăng ký mới
            </button>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            @if (mode() === 'register') {
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Tên thân mật (Vợ / Chồng) *
                </label>
                <input
                  type="text"
                  name="displayName"
                  [ngModel]="displayName()"
                  (ngModelChange)="displayName.set($event)"
                  placeholder="VD: Vợ Ngoan 🐱 hoặc Chồng Đẹp Trai 🐶"
                  required
                  class="toy-input"
                />
              </div>
            }

            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                Email của bạn *
              </label>
              <input
                type="email"
                name="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                placeholder="vochong@family.vn"
                required
                class="toy-input"
              />
            </div>

            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                Mật khẩu két sắt *
              </label>
              <input
                type="password"
                name="password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                placeholder="Tối thiểu 6 ký tự..."
                required
                minlength="6"
                class="toy-input"
              />
            </div>

            @if (mode() === 'register') {
              <div>
                <label class="block text-xs font-extrabold uppercase tracking-wider text-[#2D2A32]/80 mb-1">
                  Nhập lại mật khẩu xác nhận *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  [ngModel]="confirmPassword()"
                  (ngModelChange)="confirmPassword.set($event)"
                  placeholder="Nhập lại đúng mật khẩu ở trên..."
                  required
                  minlength="6"
                  class="toy-input"
                  [ngClass]="{
                    'border-[#BE123C] bg-[#FFE4E6]/40':
                      confirmPassword() && password() !== confirmPassword(),
                    'border-[#15803D] bg-[#DCFCE7]/40':
                      confirmPassword() && password() === confirmPassword()
                  }"
                />
                @if (confirmPassword() && password() !== confirmPassword()) {
                  <p class="text-xs font-extrabold text-[#BE123C] mt-1">
                    🚨 Hai mật khẩu chưa khớp nhau kìa!
                  </p>
                } @else if (confirmPassword() && password() === confirmPassword()) {
                  <p class="text-xs font-extrabold text-[#15803D] mt-1">
                    ✅ Mật khẩu đã khớp chuẩn!
                  </p>
                }
              </div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="toy-btn w-full py-3.5 text-base font-extrabold mt-2"
              [ngClass]="
                mode() === 'login'
                  ? 'bg-[#22C55E] text-white'
                  : 'bg-[#FF8FAB] text-[#2D2A32]'
              "
            >
              @if (loading()) {
                <span>⏳ Đang mở khóa két sắt...</span>
              } @else if (mode() === 'login') {
                <span>🏡 Mở két sắt tổ ấm ngay!</span>
              } @else {
                <span>🎉 Tạo tài khoản & Vào tổ ấm!</span>
              }
            </button>
          </form>

          <!-- Cute Footer Tip -->
          <div class="mt-6 pt-4 border-t-2 border-dashed border-[#2D2A32]/15 text-center">
            <p class="text-xs font-bold text-[#2D2A32]/70">
              💡 Mẹo nhỏ: Vợ và Chồng mỗi người tạo 1 tài khoản riêng rồi nhập chung
              <span class="text-[#BE123C] font-extrabold">Mã Tổ Ấm</span> để đồng bộ tức thì nha!
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly dataSync = inject(DataSyncService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly displayName = signal<string>('');
  readonly loading = signal<boolean>(false);

  async onSubmit(): Promise<void> {
    if (!this.email().trim() || !this.password()) {
      this.toast.show('warning', 'Thiếu thông tin! 🔑', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    if (this.mode() === 'register') {
      if (this.password().length < 6) {
        this.toast.show('warning', 'Mật khẩu hơi ngắn! 🔒', 'Mật khẩu cần tối thiểu 6 ký tự nha.');
        return;
      }
      if (this.password() !== this.confirmPassword()) {
        this.toast.show('warning', 'Mật khẩu không khớp! 🚨', 'Mật khẩu nhập lại chưa giống mật khẩu ở trên.');
        return;
      }
    }

    this.loading.set(true);
    try {
      if (this.mode() === 'register') {
        if (!this.displayName().trim()) {
          this.toast.show('warning', 'Tên gọi đâu rồi? 🐱', 'Hãy nhập biệt danh đáng yêu của bạn.');
          this.loading.set(false);
          return;
        }
        await this.authService.signUp(
          this.email(),
          this.password(),
          this.displayName()
        );
        this.toast.show(
          'success',
          'Đăng ký thành công! 🎉',
          'Chào mừng bạn! Hãy tạo tổ ấm mới hoặc nhập mã gia đình nha.'
        );
      } else {
        await this.authService.signIn(this.email(), this.password());
      }

      // Check family_members right after sign in / sign up
      const family = await this.familyService.loadCurrentFamily();
      if (family) {
        await this.dataSync.loadAllFamilyData();
        await this.router.navigate(['/dashboard']);
      } else {
        await this.router.navigate(['/onboarding']);
      }
    } catch (err: any) {
      this.toast.show(
        'error',
        'Không mở được két sắt! 🚨',
        err?.message || 'Kiểm tra lại Email hoặc Mật khẩu nhé.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
