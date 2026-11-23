import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PiggyMood = 'RICH' | 'CHILL' | 'BROKE' | 'SLEEPY';

@Component({
  selector: 'app-piggy-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toy-card-lg p-5 sm:p-6 relative overflow-hidden transition-colors duration-300"
      [ngClass]="{
        'bg-gradient-to-br from-[#DCFCE7] via-[#FFFDF5] to-[#FEF3C7]': mood === 'RICH',
        'bg-gradient-to-br from-[#E0F2FE] via-[#FFFDF5] to-[#FFE4E6]': mood === 'CHILL',
        'bg-gradient-to-br from-[#FFE4E6] via-[#FFFDF5] to-[#FEF3C7]': mood === 'BROKE',
        'bg-gradient-to-br from-[#FFF9EC] via-[#FFFDF5] to-[#EDE9FE]': mood === 'SLEEPY'
      }"
    >
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <!-- Custom Crisp SVG Piggy Mascot -->
        <div class="w-28 h-28 sm:w-32 sm:h-32 shrink-0 animate-float select-none">
          @switch (mood) {
            @case ('RICH') {
              <!-- Heo đeo kính râm ôm cọc tiền 😎 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <!-- Coins / Money Stack Glow -->
                <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3" stroke-dasharray="6 4"/>
                <!-- Ears -->
                <path d="M35 44 L22 22 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L118 22 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <!-- Head -->
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Gold Coin Slot -->
                <rect x="56" y="25" width="28" height="7" rx="3.5" fill="#FFB020" stroke="#2D2A32" stroke-width="3"/>
                <!-- Cool Sunglasses 😎 -->
                <path d="M32 60 H108" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <rect x="38" y="54" width="26" height="17" rx="5" fill="#2D2A32"/>
                <rect x="76" y="54" width="26" height="17" rx="5" fill="#2D2A32"/>
                <path d="M43 58 L50 67" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M81 58 L88 67" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Snout -->
                <ellipse cx="70" cy="80" rx="16" ry="11" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="64" cy="80" r="3" fill="#2D2A32"/>
                <circle cx="76" cy="80" r="3" fill="#2D2A32"/>
                <!-- Confident Smile -->
                <path d="M56 97 Q70 107 84 97" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <!-- Stack of VND Cash Held in Front -->
                <rect x="44" y="104" width="52" height="22" rx="6" fill="#22C55E" stroke="#2D2A32" stroke-width="3.5"/>
                <rect x="64" y="104" width="12" height="22" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                <text x="115" y="42" font-size="18">💸</text>
                <text x="12" y="95" font-size="18">💎</text>
              </svg>
            }

            @case ('CHILL') {
              <!-- Heo gật gù uống trà sữa 🧋 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#E0F2FE" stroke="#2D2A32" stroke-width="3"/>
                <!-- Ears -->
                <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <!-- Head -->
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Happy Cute Eyes -->
                <path d="M44 62 Q51 54 58 62" fill="none" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <path d="M82 62 Q89 54 96 62" fill="none" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <!-- Blush Cheeks -->
                <circle cx="42" cy="75" r="6" fill="#FF5C6C" opacity="0.5"/>
                <circle cx="98" cy="75" r="6" fill="#FF5C6C" opacity="0.5"/>
                <!-- Snout -->
                <ellipse cx="70" cy="78" rx="15" ry="10.5" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="78" r="2.8" fill="#2D2A32"/>
                <circle cx="75" cy="78" r="2.8" fill="#2D2A32"/>
                <!-- Sipping Mouth -->
                <circle cx="75" cy="96" r="4" fill="#2D2A32"/>
                <!-- Boba Milk Tea Cup 🧋 -->
                <path d="M76 96 L94 84" stroke="#FF5C6C" stroke-width="4" stroke-linecap="round"/>
                <rect x="88" y="88" width="24" height="32" rx="6" fill="#FDE68A" stroke="#2D2A32" stroke-width="3.5"/>
                <path d="M85 88 H115" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <circle cx="95" cy="112" r="2.5" fill="#2D2A32"/>
                <circle cx="101" cy="114" r="2.5" fill="#2D2A32"/>
                <circle cx="106" cy="111" r="2.5" fill="#2D2A32"/>
              </svg>
            }

            @case ('BROKE') {
              <!-- Heo khóc ròng ôm ví rỗng có con ruồi bay ra 😭💸 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#FFE4E6" stroke="#2D2A32" stroke-width="3"/>
                <!-- Droopy Ears -->
                <path d="M35 48 L18 38 L45 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 48 L122 38 L95 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <!-- Head -->
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Crying Waterfall Tears 😭 -->
                <path d="M46 65 V102" stroke="#38BDF8" stroke-width="7" stroke-linecap="round"/>
                <path d="M94 65 V102" stroke="#38BDF8" stroke-width="7" stroke-linecap="round"/>
                <circle cx="46" cy="60" r="4.5" fill="#2D2A32"/>
                <circle cx="94" cy="60" r="4.5" fill="#2D2A32"/>
                <!-- Snout -->
                <ellipse cx="70" cy="77" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="77" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="77" r="2.5" fill="#2D2A32"/>
                <!-- Wailing Mouth -->
                <path d="M58 98 Q70 89 82 98" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <!-- Empty Wallet + Little Fly buzzing out -->
                <rect x="50" y="105" width="40" height="20" rx="5" fill="#D4C5B9" stroke="#2D2A32" stroke-width="3"/>
                <path d="M88 100 Q98 85 112 90" fill="none" stroke="#2D2A32" stroke-width="2" stroke-dasharray="3 3"/>
                <circle cx="115" cy="88" r="3.5" fill="#2D2A32"/>
                <ellipse cx="113" cy="84" rx="3" ry="2" fill="#FFFFFF" stroke="#2D2A32" stroke-width="1.5"/>
                <ellipse cx="117" cy="84" rx="3" ry="2" fill="#FFFFFF" stroke="#2D2A32" stroke-width="1.5"/>
              </svg>
            }

            @default {
              <!-- Heo nằm ngủ khò khò 💤 (SLEEPY) -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#EDE9FE" stroke="#2D2A32" stroke-width="3"/>
                <!-- Ears -->
                <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <!-- Head -->
                <circle cx="70" cy="76" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Closed Sleeping Eyes -->
                <path d="M43 62 Q50 69 57 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M83 62 Q90 69 97 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <!-- Snot Bubble 💤 -->
                <circle cx="96" cy="76" r="9" fill="#E0F2FE" stroke="#2D2A32" stroke-width="2.5" opacity="0.9"/>
                <!-- Snout -->
                <ellipse cx="70" cy="80" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="80" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="80" r="2.5" fill="#2D2A32"/>
                <!-- Zzz -->
                <text x="98" y="38" font-family="Baloo 2, cursive" font-weight="800" font-size="18" fill="#2D2A32">Zzz</text>
              </svg>
            }
          }
        </div>

        <!-- Speech Bubble & Status Badge -->
        <div class="flex-1 text-center sm:text-left space-y-2">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-[#2D2A32] bg-white shadow-[0_2px_0_#2D2A32]">
            <span class="text-lg">{{ moodInfo().emoji }}</span>
            <span class="font-display font-extrabold text-xs uppercase tracking-wider text-[#2D2A32]">
              {{ moodInfo().badge }}
            </span>
          </div>

          <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32] leading-snug">
            "{{ moodInfo().quote }}"
          </h2>

          <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
            {{ moodInfo().subtext }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class PiggyMascotComponent {
  @Input() mood: PiggyMood = 'SLEEPY';
  @Input() savingsRate = 0;

  readonly moodInfo = computed(() => {
    switch (this.mood) {
      case 'RICH':
        return {
          emoji: '😎',
          badge: `Tỉ lệ tiết kiệm: +${this.savingsRate.toFixed(0)}% • Đỉnh của chóp`,
          quote: 'Đỉnh nóc kịch trần! Tháng này giàu nứt đố đổ vách!',
          subtext:
            'Hai vợ chồng giữ phong độ này là chẳng mấy chốc mua thêm biệt phủ nha!',
        };
      case 'CHILL':
        return {
          emoji: '🧋',
          badge: `Tỉ lệ tiết kiệm: +${this.savingsRate.toFixed(0)}% • An toàn`,
          quote: 'Tạm ổn nha, nhớ bớt lướt sàn cam lại đó!',
          subtext:
            'Thu vẫn lớn hơn Chi! Cố gắng tích lũy lên trên 30% để heo đất đeo kính râm nào.',
        };
      case 'BROKE':
        return {
          emoji: '😭💸',
          badge: 'Báo động đỏ • Chi vượt Thu',
          quote:
            'Báo động đỏ! Chuẩn bị thực đơn mì tôm trứng thôi hai vợ chồng ơi!',
          subtext:
            'Chi tiêu đang lớn hơn thu nhập trong kỳ này rồi, kiểm tra lại các khoản mua sắm nhé!',
        };
      default:
        return {
          emoji: '💤',
          badge: 'Chưa có giao dịch trong kỳ',
          quote: 'Sổ sạch bong kin kít, hôm nay nhà mình chưa tốn xu nào!',
          subtext:
            'Bấm "+ Ting ting lúa về" hoặc "- Lại chốt đơn" để bắt đầu ghi sổ tay gia đình nhé!',
        };
    }
  });
}
