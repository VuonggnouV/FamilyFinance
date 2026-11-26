import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PiggyMood =
  | 'RICH'
  | 'SHOPPING_SPREE'
  | 'CHILL'
  | 'TIGHT'
  | 'BROKE'
  | 'SLEEPY';

interface MascotLine {
  emoji: string;
  badge: string;
  quote: string;
  subtext: string;
}

const MOOD_QUOTES: Record<PiggyMood, MascotLine[]> = {
  RICH: [
    {
      emoji: '😎💎💸',
      badge: 'Đỉnh của chóp • Giàu nứt đố đổ vách',
      quote: 'Đỉnh nóc kịch trần! Tháng này giàu nứt đố đổ vách!',
      subtext:
        'Hai vợ chồng giữ phong độ này là chẳng mấy chốc tậu thêm biệt phủ, sổ đỏ cầm mỏi tay nha! 🏰✨',
    },
    {
      emoji: '🐷👑💰',
      badge: 'Đại gia ngầm • Két sắt căng phồng',
      quote: 'Tiền vô như nước sông Đà, heo đất ăn no căng rốn luôn rồi!',
      subtext:
        'Tỉ lệ tiết kiệm quá khủng! Cuối tuần tự thưởng 1 bữa lẩu thật ngon nha 2 vợ chồng ơi! 🍲🥂',
    },
    {
      emoji: '🦖🐱🚀',
      badge: 'Vợ chồng hợp sức • Tài chính bay cao',
      quote: 'Thuận vợ thuận chồng, tát biển Đông cũng đầy két sắt!',
      subtext:
        'Tháng này quản lý tiền khéo số 1! Heo đất xin ngả mũ bái phục Nóc Nhà và Trụ Cột! 🎩💖',
    },
    {
      emoji: '🕶️💵🔥',
      badge: 'Thần Tài gõ cửa • Lúa về ngập kho',
      quote: 'Ting ting liên hoàn cước! Ví dày thế này đi đâu cũng tự tin!',
      subtext:
        'Nhớ trích một phần bỏ heo dài hạn để tiền đẻ ra tiền nha hai đại gia! 📈💎',
    },
    {
      emoji: '🥳🏆✨',
      badge: 'Huy chương vàng tiết kiệm • Quá xuất sắc',
      quote: 'Ai độ mà tháng này giữ tiền giỏi dữ vậy trời?!',
      subtext:
        'Cứ đà này cuối năm nhìn lại số dư là cười tít mắt cả ngày luôn đó! 😍🎉',
    },
  ],
  SHOPPING_SPREE: [
    {
      emoji: '🛍️📦💦',
      badge: 'Bão chốt đơn hôm nay • Shipper gọi cháy máy',
      quote: 'Alo alo! Hôm nay chốt đơn hơi bị đều tay rồi đó nha!',
      subtext:
        'Tổng tháng vẫn ổn nhưng hôm nay ví hơi bị đau bụng rồi đó! Phanh nhẹ tay kẻo sàn cam trao bằng khen! 🚓🛒',
    },
    {
      emoji: '📦🏃‍♂️💸',
      badge: 'Tín đồ săn sale • Tay nhanh hơn não',
      quote: 'Nghe tiếng xé bọc hàng rột rột từ sáng tới giờ luôn á!',
      subtext:
        'Mua gì mà vui dữ vậy hai vợ chồng? Nhớ kiểm tra đơn nào không ưng thì bấm "Trả hàng ↩️" liền nha! 🛒✨',
    },
    {
      emoji: '💳🔥😅',
      badge: 'Thẻ quẹt tóe lửa • Hôm nay tiêu hơi sung',
      quote: 'Hôm nay thần giữ của đi vắng hay sao mà tiền bay vèo vèo thế!',
      subtext:
        'Ngày mai khâu túi lại một xíu cho heo đất thở oxy với nha hai bạn trẻ ơi! 🐷🫧',
    },
    {
      emoji: '🛒🚨👀',
      badge: 'Radar soi ví • Hôm nay nhiều đơn mới',
      quote: 'Shipper vừa hỏi thăm: "Nhà mình mở đại lý nhận hàng hả anh chị?"',
      subtext:
        'May mà lúa tháng này vẫn gánh được, nhưng nhớ bớt lướt livestream đêm khuya lại nha! 📱🌙',
    },
    {
      emoji: '🎁💸🤭',
      badge: 'Chốt đơn thần tốc • Ví rung bần bật',
      quote: 'Mỗi lần điện thoại sáng đèn là heo đất lại giật mình thon thót!',
      subtext:
        'Thôi lỡ mua rồi thì dùng cho sướng, từ mai chuyển sang chế độ tu tâm dưỡng ví nhé! 🧘‍♂️💖',
    },
  ],
  CHILL: [
    {
      emoji: '🧋✨🐷',
      badge: 'An toàn ấm êm • Vẫn trong tầm kiểm soát',
      quote: 'Tạm ổn nha, nhớ bớt lướt sàn cam lại chút xíu là đẹp!',
      subtext:
        'Thu vẫn lớn hơn Chi! Ráng tích lũy thêm chút nữa để heo đất được đeo kính râm nào! 😎💪',
    },
    {
      emoji: '🍵😌🌿',
      badge: 'Nhịp độ vừa phải • Sổ sách gọn gàng',
      quote: 'Tháng này chi tiêu khá điềm đạm, xứng đáng 1 ly trà sữa ít đường!',
      subtext:
        'Cứ ghi chép đều tay mỗi ngày thế này là không bao giờ sợ thất thoát tiền lẻ đâu nha! 📒✅',
    },
    {
      emoji: '🐱🐶💖',
      badge: 'Đồng tâm hiệp lực • Thu vẫn thắng Chi',
      quote: 'Hai vợ chồng phối hợp nhịp nhàng phết! Tiền vào vẫn nhiều hơn tiền ra!',
      subtext:
        'Giữ vững phong độ tới cuối tháng là có dư một khoản kha khá bỏ ống rồi! 🏡🌾',
    },
    {
      emoji: '🎈🐷🎵',
      badge: 'Tài chính cân bằng • Heo đất yêu đời',
      quote: 'Không giàu đột biến nhưng cũng chẳng thiếu thốn gì, chill phết!',
      subtext:
        'Cắt bớt vài khoản lặt vặt không cần thiết nữa là nhảy lên hạng Đại Gia ngay! 🚀✨',
    },
  ],
  TIGHT: [
    {
      emoji: '🍜🥚⚠️',
      badge: 'Cảnh báo vàng • Chi tiêu sát nút Thu nhập',
      quote: 'Ối dồi ôi! Tiền Chi sắp đuổi kịp tiền Thu tới nơi rồi kìa!',
      subtext:
        'Từ giờ tới cuối tháng chuyển sang chế độ ăn cơm nhà, khóa app mua sắm khẩn cấp nha! 🔒🍱',
    },
    {
      emoji: '⏳💸😬',
      badge: 'Thắt lưng buộc bụng • Ranh giới mong manh',
      quote: 'Ví đang mỏng như tờ giấy A4 rồi, thở mạnh cũng sợ bay mất tiền!',
      subtext:
        'Trước khi xuống tiền mua món gì nhớ hỏi nhau câu thần chú: "Có thực sự cần không?" nha! 🤔💡',
    },
    {
      emoji: '🥫🍳🐷',
      badge: 'Chế độ tiết kiệm khẩn • Giữ chặt hầu bao',
      quote: 'Heo đất đang phải hóp bụng lại rồi đó hai vợ chồng ơi!',
      subtext:
        'Đợi đợt "Ting ting lúa về" tiếp theo cứu viện thôi nào! 🌾🆘',
    },
  ],
  BROKE: [
    {
      emoji: '😭💸🪰',
      badge: 'Báo động đỏ • Chi vượt Thu mất rồi',
      quote:
        'Báo động đỏ! Chuẩn bị thực đơn mì tôm trứng thôi hai vợ chồng ơi!',
      subtext:
        'Mở ví ra thấy con ruồi bay ra kêu vo ve rồi! Kiểm tra lại các khoản mua sắm hoặc đòi nợ gấp nhé! 🚨🔔',
    },
    {
      emoji: '🚑💳😱',
      badge: 'Cấp cứu két sắt • Thủng đáy hầu bao',
      quote: 'Toang thật rồi Buồn ơi! Tháng này tiêu lố tay quá đà rồi!',
      subtext:
        'Xem có đơn nào hoàn tiền được hoặc khoản Cho mượn nào tới hạn đòi về đắp vào ngay đi nào! 🤝↩️',
    },
    {
      emoji: '🌧️🐷🍂',
      badge: 'Heo đất suy dinh dưỡng • Âm dòng tiền',
      quote: 'Ngoài trời mưa rơi hay nước mắt heo đất đang rơi vậy nè...',
      subtext:
        'Không sao, vấp ngã ở đâu mình đứng lên kiếm lúa bù lại ở đó! Cố lên hai vợ chồng! 💪🌾',
    },
    {
      emoji: '🆘🍜📉',
      badge: 'Đèn đỏ chớp tắt • Tạm ngưng chốt đơn',
      quote: 'Khóa thẻ! Xóa giỏ hàng! Tắt thông báo Shopee ngay và luôn!',
      subtext:
        'Tháng này âm ngân sách rồi, cùng nhau siết lại chi tiêu để tháng sau phục thù nha! 🛡️🔥',
    },
  ],
  SLEEPY: [
    {
      emoji: '💤🫧🐷',
      badge: 'Sổ mới tinh tươm • Chưa có giao dịch',
      quote: 'Sổ sạch bong kin kít, kỳ này nhà mình chưa tốn xu nào!',
      subtext:
        'Bấm "+ Ting ting lúa về" hoặc "- Lại chốt đơn" để đánh thức heo đất dậy ghi sổ nhé! 📒✨',
    },
    {
      emoji: '🛌🌙✨',
      badge: 'Heo đất đang ngủ nướng • Bình yên quá đỗi',
      quote: 'Khò khò... Không ai tiêu tiền là giấc ngủ ngon nhất trần đời!',
      subtext:
        'Khi nào có lương về nhớ gọi heo dậy đầu tiên để bắn pháo giấy ăn mừng nha! 🎉🌾',
    },
    {
      emoji: '🧘‍♂️🍃🐷',
      badge: 'Tịnh tâm giữ ví • 0 đồng phát sinh',
      quote: 'Một ngày không tiêu tiền là một ngày ví mỉm cười hạnh phúc!',
      subtext:
        'Chạm vào nút + bên dưới bất cứ lúc nào bạn cần ghi chép thu chi nhé! 💖',
    },
  ],
};

@Component({
  selector: 'app-piggy-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toy-card-lg p-5 sm:p-6 relative overflow-hidden transition-colors duration-300"
      [ngClass]="{
        'bg-gradient-to-br from-[#DCFCE7] via-[#FFFDF5] to-[#FEF3C7]': mood === 'RICH',
        'bg-gradient-to-br from-[#FEF3C7] via-[#FFFDF5] to-[#FFE4E6]': mood === 'SHOPPING_SPREE' || mood === 'TIGHT',
        'bg-gradient-to-br from-[#E0F2FE] via-[#FFFDF5] to-[#FFE4E6]': mood === 'CHILL',
        'bg-gradient-to-br from-[#FFE4E6] via-[#FFFDF5] to-[#FEF3C7]': mood === 'BROKE',
        'bg-gradient-to-br from-[#FFF9EC] via-[#FFFDF5] to-[#EDE9FE]': mood === 'SLEEPY'
      }"
    >
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <!-- Custom Crisp SVG Piggy Mascot (Click to randomize quote!) -->
        <div
          (click)="nextRandomQuote()"
          title="Bấm vào Heo Đất để nghe phán câu khác!"
          class="w-28 h-28 sm:w-32 sm:h-32 shrink-0 animate-float select-none cursor-pointer active:scale-95 transition-transform"
        >
          @switch (mood) {
            @case ('RICH') {
              <!-- Heo đeo kính râm ôm cọc tiền 😎 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3" stroke-dasharray="6 4"/>
                <path d="M35 44 L22 22 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L118 22 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <rect x="56" y="25" width="28" height="7" rx="3.5" fill="#FFB020" stroke="#2D2A32" stroke-width="3"/>
                <path d="M32 60 H108" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <rect x="38" y="54" width="26" height="17" rx="5" fill="#2D2A32"/>
                <rect x="76" y="54" width="26" height="17" rx="5" fill="#2D2A32"/>
                <path d="M43 58 L50 67" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M81 58 L88 67" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
                <ellipse cx="70" cy="80" rx="16" ry="11" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="64" cy="80" r="3" fill="#2D2A32"/>
                <circle cx="76" cy="80" r="3" fill="#2D2A32"/>
                <path d="M56 97 Q70 107 84 97" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <rect x="44" y="104" width="52" height="22" rx="6" fill="#22C55E" stroke="#2D2A32" stroke-width="3.5"/>
                <rect x="64" y="104" width="12" height="22" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                <text x="112" y="42" font-size="18">💸</text>
                <text x="10" y="95" font-size="18">💎</text>
              </svg>
            }

            @case ('SHOPPING_SPREE') {
              <!-- Heo săn sale ôm thùng hàng toát mồ hôi hột 🛍️📦💦 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                <path d="M35 44 L22 22 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L118 22 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Wide excited/shocked shopping eyes -->
                <circle cx="49" cy="60" r="8" fill="#FFFFFF" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="91" cy="60" r="8" fill="#FFFFFF" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="49" cy="60" r="3.5" fill="#2D2A32"/>
                <circle cx="91" cy="60" r="3.5" fill="#2D2A32"/>
                <!-- Sweat drop 💦 -->
                <path d="M104 44 Q112 54 104 60 Q96 54 104 44 Z" fill="#38BDF8" stroke="#2D2A32" stroke-width="2.5"/>
                <!-- Snout -->
                <ellipse cx="70" cy="78" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="78" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="78" r="2.5" fill="#2D2A32"/>
                <!-- Parcel Box & Shopping Bag in front 📦🛍️ -->
                <rect x="42" y="98" width="56" height="28" rx="5" fill="#FFB020" stroke="#2D2A32" stroke-width="3.5"/>
                <line x1="70" y1="98" x2="70" y2="126" stroke="#2D2A32" stroke-width="3"/>
                <text x="108" y="40" font-size="18">🛍️</text>
                <text x="10" y="42" font-size="18">📦</text>
              </svg>
            }

            @case ('TIGHT') {
              <!-- Heo ôm tô mì tôm trứng thắt lưng buộc bụng 🍜🥚 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <!-- Worried eyebrows & eyes -->
                <line x1="40" y1="52" x2="56" y2="56" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <line x1="100" y1="52" x2="84" y2="56" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="49" cy="62" r="4" fill="#2D2A32"/>
                <circle cx="91" cy="62" r="4" fill="#2D2A32"/>
                <!-- Snout -->
                <ellipse cx="70" cy="76" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="76" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="76" r="2.5" fill="#2D2A32"/>
                <!-- Noodle Bowl 🍜 -->
                <path d="M44 102 H96 L88 124 H52 Z" fill="#FF5C6C" stroke="#2D2A32" stroke-width="3.5" stroke-linejoin="round"/>
                <text x="108" y="42" font-size="18">🍜</text>
                <text x="10" y="96" font-size="18">🥚</text>
              </svg>
            }

            @case ('CHILL') {
              <!-- Heo gật gù uống trà sữa 🧋 -->
              <svg viewBox="0 0 140 140" class="w-full h-full">
                <circle cx="70" cy="72" r="56" fill="#E0F2FE" stroke="#2D2A32" stroke-width="3"/>
                <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <path d="M44 62 Q51 54 58 62" fill="none" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <path d="M82 62 Q89 54 96 62" fill="none" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                <circle cx="42" cy="75" r="6" fill="#FF5C6C" opacity="0.5"/>
                <circle cx="98" cy="75" r="6" fill="#FF5C6C" opacity="0.5"/>
                <ellipse cx="70" cy="78" rx="15" ry="10.5" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="78" r="2.8" fill="#2D2A32"/>
                <circle cx="75" cy="78" r="2.8" fill="#2D2A32"/>
                <circle cx="75" cy="96" r="4" fill="#2D2A32"/>
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
                <path d="M35 48 L18 38 L45 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 48 L122 38 L95 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <path d="M46 65 V102" stroke="#38BDF8" stroke-width="7" stroke-linecap="round"/>
                <path d="M94 65 V102" stroke="#38BDF8" stroke-width="7" stroke-linecap="round"/>
                <circle cx="46" cy="60" r="4.5" fill="#2D2A32"/>
                <circle cx="94" cy="60" r="4.5" fill="#2D2A32"/>
                <ellipse cx="70" cy="77" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="77" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="77" r="2.5" fill="#2D2A32"/>
                <path d="M58 98 Q70 89 82 98" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
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
                <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="70" cy="76" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                <path d="M43 62 Q50 69 57 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M83 62 Q90 69 97 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="96" cy="76" r="9" fill="#E0F2FE" stroke="#2D2A32" stroke-width="2.5" opacity="0.9"/>
                <ellipse cx="70" cy="80" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                <circle cx="65" cy="80" r="2.5" fill="#2D2A32"/>
                <circle cx="75" cy="80" r="2.5" fill="#2D2A32"/>
                <text x="98" y="38" font-family="Baloo 2, cursive" font-weight="800" font-size="18" fill="#2D2A32">Zzz</text>
              </svg>
            }
          }
        </div>

        <!-- Speech Bubble & Status Badge -->
        <div class="flex-1 text-center sm:text-left space-y-2">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-[#2D2A32] bg-white shadow-[0_2px_0_#2D2A32]">
              <span class="text-lg">{{ currentLine().emoji }}</span>
              <span class="font-display font-extrabold text-xs uppercase tracking-wider text-[#2D2A32]">
                {{ currentLine().badge }}
              </span>
            </div>

            <button
              type="button"
              (click)="nextRandomQuote()"
              class="px-2.5 py-1 rounded-full border-2 border-[#2D2A32] bg-[#FFF9EC] hover:bg-[#FEF3C7] active:translate-y-0.5 font-display font-extrabold text-xs text-[#2D2A32] cursor-pointer"
              title="Đổi câu thoại khác"
            >
              🎲 Phán câu khác
            </button>
          </div>

          <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#2D2A32] leading-snug">
            "{{ currentLine().quote }}"
          </h2>

          <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75">
            {{ currentLine().subtext }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class PiggyMascotComponent implements OnChanges {
  @Input() mood: PiggyMood = 'SLEEPY';
  @Input() savingsRate = 0;
  @Input() triggerCount = 0;

  private readonly moodSignal = signal<PiggyMood>('SLEEPY');
  private readonly quoteIndex = signal<number>(0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mood']) {
      this.moodSignal.set(this.mood);
      const pool = MOOD_QUOTES[this.mood] || MOOD_QUOTES.SLEEPY;
      this.quoteIndex.set(Math.floor(Math.random() * pool.length));
    } else if (changes['triggerCount']) {
      this.nextRandomQuote();
    }
  }

  nextRandomQuote(): void {
    const pool = MOOD_QUOTES[this.moodSignal()] || MOOD_QUOTES.SLEEPY;
    if (pool.length <= 1) return;
    const current = this.quoteIndex();
    let next = Math.floor(Math.random() * pool.length);
    if (next === current) {
      next = (current + 1) % pool.length;
    }
    this.quoteIndex.set(next);
  }

  readonly currentLine = computed(() => {
    const m = this.moodSignal();
    const pool = MOOD_QUOTES[m] || MOOD_QUOTES.SLEEPY;
    const item = pool[this.quoteIndex() % pool.length] || pool[0];
    return item;
  });
}
