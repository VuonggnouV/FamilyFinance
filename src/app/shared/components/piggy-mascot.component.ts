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
      emoji: '😎',
      badge: 'ĐẠI GIA ĐỈNH NÓC',
      quote: 'Đỉnh nóc kịch trần! Tháng này giàu nứt đố đổ vách!',
      subtext:
        'Hai vợ chồng giữ phong độ này là chẳng mấy chốc tậu thêm biệt phủ, sổ đỏ cầm mỏi tay nha! 🏰✨',
    },
    {
      emoji: '👑',
      badge: 'KÉT SẮT CĂNG PHỒNG',
      quote: 'Tiền vô như nước sông Đà, heo đất ăn no căng rốn luôn rồi!',
      subtext:
        'Tỉ lệ tiết kiệm quá khủng! Cuối tuần tự thưởng một bữa lẩu thật ngon nha hai vợ chồng ơi! 🍲🥂',
    },
    {
      emoji: '🚀',
      badge: 'TÀI CHÍNH BAY CAO',
      quote: 'Thuận vợ thuận chồng, tát biển Đông cũng đầy két sắt!',
      subtext:
        'Tháng này quản lý tiền khéo số một! Heo đất xin ngả mũ bái phục Nóc Nhà và Trụ Cột! 🎩💖',
    },
    {
      emoji: '💎',
      badge: 'LÚA VỀ NGẬP KHO',
      quote: 'Ting ting liên hoàn cước! Ví dày thế này đi đâu cũng tự tin!',
      subtext:
        'Nhớ trích một phần bỏ heo dài hạn để tiền đẻ ra tiền nha hai đại gia! 📈💰',
    },
    {
      emoji: '🏆',
      badge: 'VÔ ĐỊCH TIẾT KIỆM',
      quote: 'Ai độ mà tháng này giữ tiền giỏi dữ vậy trời?!',
      subtext:
        'Cứ đà này cuối năm nhìn lại số dư là cười tít mắt cả ngày luôn đó! 😍🎉',
    },
  ],
  SHOPPING_SPREE: [
    {
      emoji: '🛍️',
      badge: 'BÃO CHỐT ĐƠN',
      quote: 'Alo alo! Hôm nay chốt đơn hơi bị đều tay rồi đó nha!',
      subtext:
        'Tổng tháng vẫn ổn nhưng hôm nay ví hơi đau bụng rồi đó! Phanh nhẹ tay kẻo sàn cam trao bằng khen! 🚓🛒',
    },
    {
      emoji: '📦',
      badge: 'TÍN ĐỒ SĂN SALE',
      quote: 'Nghe tiếng xé bọc hàng rột rột từ sáng tới giờ luôn á!',
      subtext:
        'Mua gì mà vui dữ vậy hai vợ chồng? Nhớ kiểm tra đơn nào không ưng thì bấm Trả hàng liền nha! 🛒✨',
    },
    {
      emoji: '💳',
      badge: 'THẺ QUẸT TÓE LỬA',
      quote: 'Hôm nay thần giữ của đi vắng hay sao mà tiền bay vèo vèo thế!',
      subtext:
        'Ngày mai khâu túi lại một xíu cho heo đất thở oxy với nha hai bạn trẻ ơi! 🐷🫧',
    },
    {
      emoji: '🛒',
      badge: 'SHIPPER GỌI CHÁY MÁY',
      quote: 'Shipper vừa hỏi thăm: "Nhà mình mở đại lý nhận hàng hả anh chị?"',
      subtext:
        'May mà lúa tháng này vẫn gánh được, nhưng nhớ bớt lướt livestream đêm khuya lại nha! 📱🌙',
    },
    {
      emoji: '🎁',
      badge: 'CHỐT ĐƠN THẦN TỐC',
      quote: 'Mỗi lần điện thoại sáng đèn là heo đất lại giật mình thon thót!',
      subtext:
        'Thôi lỡ mua rồi thì dùng cho sướng, từ mai chuyển sang chế độ tu tâm dưỡng ví nhé! 🧘‍♂️💖',
    },
  ],
  CHILL: [
    {
      emoji: '🧋',
      badge: 'AN TOÀN ẤM ÊM',
      quote: 'Tạm ổn nha, nhớ bớt lướt sàn cam lại chút xíu là đẹp!',
      subtext:
        'Thu vẫn lớn hơn Chi! Ráng tích lũy thêm chút nữa để heo đất được đeo kính râm nào! 😎💪',
    },
    {
      emoji: '🍵',
      badge: 'SỔ SÁCH GỌN GÀNG',
      quote: 'Tháng này chi tiêu khá điềm đạm, xứng đáng một ly trà sữa ít đường!',
      subtext:
        'Cứ ghi chép đều tay mỗi ngày thế này là không bao giờ sợ thất thoát tiền lẻ đâu nha! 📒✅',
    },
    {
      emoji: '💖',
      badge: 'THU VẪN THẮNG CHI',
      quote: 'Hai vợ chồng phối hợp nhịp nhàng phết! Tiền vào vẫn nhiều hơn tiền ra!',
      subtext:
        'Giữ vững phong độ tới cuối tháng là có dư một khoản kha khá bỏ ống rồi! 🏡🌾',
    },
    {
      emoji: '🎵',
      badge: 'TÀI CHÍNH CÂN BẰNG',
      quote: 'Không giàu đột biến nhưng cũng chẳng thiếu thốn gì, chill phết!',
      subtext:
        'Cắt bớt vài khoản lặt vặt không cần thiết nữa là nhảy lên hạng Đại Gia ngay! 🚀✨',
    },
  ],
  TIGHT: [
    {
      emoji: '🍜',
      badge: 'CẢNH BÁO MÌ TÔM',
      quote: 'Ối dồi ôi! Tiền Chi sắp đuổi kịp tiền Thu tới nơi rồi kìa!',
      subtext:
        'Từ giờ tới cuối tháng chuyển sang chế độ ăn cơm nhà, khóa app mua sắm khẩn cấp nha! 🔒🍱',
    },
    {
      emoji: '⚠️',
      badge: 'THẮT LƯNG BUỘC BỤNG',
      quote: 'Ví đang mỏng như tờ giấy A4 rồi, thở mạnh cũng sợ bay mất tiền!',
      subtext:
        'Trước khi xuống tiền mua món gì nhớ hỏi nhau câu thần chú: "Có thực sự cần không?" nha! 🤔💡',
    },
    {
      emoji: '🥚',
      badge: 'GIỮ CHẶT HẦU BAO',
      quote: 'Heo đất đang phải hóp bụng lại rồi đó hai vợ chồng ơi!',
      subtext:
        'Đợi đợt "Ting ting lúa về" tiếp theo cứu viện thôi nào! 🌾🆘',
    },
  ],
  BROKE: [
    {
      emoji: '😭',
      badge: 'BÁO ĐỘNG ĐỎ',
      quote:
        'Báo động đỏ! Chuẩn bị thực đơn mì tôm trứng thôi hai vợ chồng ơi!',
      subtext:
        'Mở ví ra thấy con ruồi bay ra kêu vo ve rồi! Kiểm tra lại các khoản mua sắm hoặc đòi nợ gấp nhé! 🚨🔔',
    },
    {
      emoji: '🚑',
      badge: 'CẤP CỨU KÉT SẮT',
      quote: 'Toang thật rồi Buồn ơi! Tháng này tiêu lố tay quá đà rồi!',
      subtext:
        'Xem có đơn nào hoàn tiền được hoặc khoản Cho mượn nào tới hạn đòi về đắp vào ngay đi nào! 🤝↩️',
    },
    {
      emoji: '🌧️',
      badge: 'ÂM DÒNG TIỀN RỒI',
      quote: 'Ngoài trời mưa rơi hay nước mắt heo đất đang rơi vậy nè...',
      subtext:
        'Không sao, vấp ngã ở đâu mình đứng lên kiếm lúa bù lại ở đó! Cố lên hai vợ chồng! 💪🌾',
    },
    {
      emoji: '🆘',
      badge: 'NGƯNG CHỐT ĐƠN NGAY',
      quote: 'Khóa thẻ! Xóa giỏ hàng! Tắt thông báo Shopee ngay và luôn!',
      subtext:
        'Tháng này âm ngân sách rồi, cùng nhau siết lại chi tiêu để tháng sau phục thù nha! 🛡️🔥',
    },
  ],
  SLEEPY: [
    {
      emoji: '💤',
      badge: 'SỔ MỚI TINH TƯƠM',
      quote: 'Sổ sạch bong kin kít, kỳ này nhà mình chưa tốn xu nào!',
      subtext:
        'Bấm "+ Ting ting lúa về" hoặc "- Lại chốt đơn" để đánh thức heo đất dậy ghi sổ nhé! 📒✨',
    },
    {
      emoji: '🛌',
      badge: 'HEO ĐANG NGỦ NƯỚNG',
      quote: 'Khò khò... Không ai tiêu tiền là giấc ngủ ngon nhất trần đời!',
      subtext:
        'Khi nào có lương về nhớ gọi heo dậy đầu tiên để bắn pháo giấy ăn mừng nha! 🎉🌾',
    },
    {
      emoji: '🍃',
      badge: '0 ĐỒNG PHÁT SINH',
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
      <!-- Top-Right Corner Dice Button (Clean, out of the text flow!) -->
      <button
        type="button"
        (click)="nextRandomQuote()"
        class="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-[#2D2A32] bg-white hover:bg-[#FEF3C7] active:translate-y-0.5 font-display font-extrabold text-xs text-[#2D2A32] cursor-pointer shadow-[0_2px_0_#2D2A32]"
        title="Đổi câu thoại & hiệu ứng khác"
      >
        <span>🎲</span>
        <span>Đổi câu</span>
      </button>

      <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <!-- Avatar Column: Animated SVG Mascot + Overlapping 1-Line Sticker Badge -->
        <div
          (click)="nextRandomQuote()"
          title="Chạm vào Heo Đất để xem hiệu ứng & phán câu khác!"
          class="flex flex-col items-center shrink-0 select-none cursor-pointer"
          [class.animate-jelly-pop]="popping()"
        >
          <div class="w-28 h-28 sm:w-32 sm:h-32 relative">
            @switch (mood) {
              @case ('RICH') {
                <!-- Heo Đại Gia Nhún Nhảy Disco + Đồng Xu Rơi Vào Lưng + Kim Cương Bay 😎💎💸 -->
                <svg viewBox="0 0 140 140" class="w-full h-full animate-piggy-dance">
                  <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3" stroke-dasharray="6 4"/>
                  <g class="animate-coin-drop">
                    <circle cx="70" cy="16" r="9" fill="#FFB020" stroke="#2D2A32" stroke-width="2.5"/>
                    <text x="66" y="20" font-size="11" font-weight="900" fill="#2D2A32">₫</text>
                  </g>
                  <path d="M35 44 L22 22 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M105 44 L118 22 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                  <rect x="56" y="26" width="28" height="7" rx="3.5" fill="#2D2A32"/>
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
                  <text x="110" y="42" font-size="18" class="animate-float">💸</text>
                  <text x="10" y="96" font-size="18" class="animate-bell">💎</text>
                </svg>
              }

              @case ('SHOPPING_SPREE') {
                <!-- Heo Săn Sale Rung Lắc + Mồ Hôi Rơi + Thùng Hàng Nhảy Tưng Tưng 🛍️📦💦 -->
                <svg viewBox="0 0 140 140" class="w-full h-full animate-piggy-dance">
                  <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                  <path d="M35 44 L22 22 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M105 44 L118 22 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                  <circle cx="49" cy="60" r="8.5" fill="#FFFFFF" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="91" cy="60" r="8.5" fill="#FFFFFF" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="49" cy="60" r="4" fill="#2D2A32"/>
                  <circle cx="91" cy="60" r="4" fill="#2D2A32"/>
                  <path
                    class="animate-sweat-drop"
                    d="M104 40 Q112 50 104 56 Q96 50 104 40 Z"
                    fill="#38BDF8"
                    stroke="#2D2A32"
                    stroke-width="2.5"
                  />
                  <ellipse cx="70" cy="78" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="65" cy="78" r="2.5" fill="#2D2A32"/>
                  <circle cx="75" cy="78" r="2.5" fill="#2D2A32"/>
                  <g class="animate-float">
                    <rect x="42" y="98" width="56" height="28" rx="5" fill="#FFB020" stroke="#2D2A32" stroke-width="3.5"/>
                    <line x1="70" y1="98" x2="70" y2="126" stroke="#2D2A32" stroke-width="3"/>
                  </g>
                  <text x="108" y="40" font-size="18" class="animate-bell">🛍️</text>
                  <text x="10" y="42" font-size="18" class="animate-float">📦</text>
                </svg>
              }

              @case ('TIGHT') {
                <!-- Heo Ôm Tô Mì Tôm Bốc Khói Nghi Ngút 🍜🥚💨 -->
                <svg viewBox="0 0 140 140" class="w-full h-full animate-float">
                  <circle cx="70" cy="72" r="56" fill="#FEF3C7" stroke="#2D2A32" stroke-width="3"/>
                  <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                  <line x1="40" y1="52" x2="56" y2="56" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                  <line x1="100" y1="52" x2="84" y2="56" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                  <circle cx="49" cy="62" r="4" fill="#2D2A32"/>
                  <circle cx="91" cy="62" r="4" fill="#2D2A32"/>
                  <path
                    class="animate-sweat-drop"
                    d="M103 44 Q110 52 103 58 Q96 52 103 44 Z"
                    fill="#38BDF8"
                    stroke="#2D2A32"
                    stroke-width="2"
                  />
                  <ellipse cx="70" cy="76" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="65" cy="76" r="2.5" fill="#2D2A32"/>
                  <circle cx="75" cy="76" r="2.5" fill="#2D2A32"/>
                  <path class="animate-steam-1" d="M58 98 Q54 90 60 84" fill="none" stroke="#2D2A32" stroke-width="2.5" stroke-linecap="round"/>
                  <path class="animate-steam-2" d="M82 98 Q86 90 80 84" fill="none" stroke="#2D2A32" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M44 102 H96 L88 124 H52 Z" fill="#FF5C6C" stroke="#2D2A32" stroke-width="3.5" stroke-linejoin="round"/>
                  <text x="108" y="42" font-size="18" class="animate-bell">🍜</text>
                  <text x="10" y="96" font-size="18">🥚</text>
                </svg>
              }

              @case ('CHILL') {
                <!-- Heo Hút Trà Sữa Trân Châu Chạy Lên Ống Hút 🧋✨ -->
                <svg viewBox="0 0 140 140" class="w-full h-full animate-float">
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
                  <circle cx="90" cy="94" r="3" fill="#2D2A32" class="animate-boba-suck"/>
                  <rect x="88" y="88" width="24" height="32" rx="6" fill="#FDE68A" stroke="#2D2A32" stroke-width="3.5"/>
                  <path d="M85 88 H115" stroke="#2D2A32" stroke-width="4" stroke-linecap="round"/>
                  <circle cx="95" cy="112" r="2.5" fill="#2D2A32"/>
                  <circle cx="101" cy="114" r="2.5" fill="#2D2A32"/>
                  <circle cx="106" cy="111" r="2.5" fill="#2D2A32"/>
                  <text x="12" y="42" font-size="16" class="animate-zzz-1">🎵</text>
                </svg>
              }

              @case ('BROKE') {
                <!-- Heo Khóc Thác Nước Chảy Ròng Ròng + Con Ruồi Bay Vòng Quanh Ví Rỗng 😭💸🪰 -->
                <svg viewBox="0 0 140 140" class="w-full h-full">
                  <circle cx="70" cy="72" r="56" fill="#FFE4E6" stroke="#2D2A32" stroke-width="3"/>
                  <path d="M35 48 L18 38 L45 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M105 48 L122 38 L95 36 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <circle cx="70" cy="74" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                  <path d="M46 65 V104" stroke="#E0F2FE" stroke-width="8" stroke-linecap="round"/>
                  <path d="M94 65 V104" stroke="#E0F2FE" stroke-width="8" stroke-linecap="round"/>
                  <path class="animate-tears-flow" d="M46 65 V104" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
                  <path class="animate-tears-flow" d="M94 65 V104" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
                  <circle cx="46" cy="60" r="4.5" fill="#2D2A32"/>
                  <circle cx="94" cy="60" r="4.5" fill="#2D2A32"/>
                  <ellipse cx="70" cy="77" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="65" cy="77" r="2.5" fill="#2D2A32"/>
                  <circle cx="75" cy="77" r="2.5" fill="#2D2A32"/>
                  <path d="M58 98 Q70 89 82 98" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                  <rect x="50" y="105" width="40" height="20" rx="5" fill="#D4C5B9" stroke="#2D2A32" stroke-width="3"/>
                  <path d="M88 100 Q98 85 112 90" fill="none" stroke="#2D2A32" stroke-width="2" stroke-dasharray="3 3"/>
                  <g class="animate-fly-orbit">
                    <circle cx="115" cy="88" r="3.5" fill="#2D2A32"/>
                    <ellipse cx="113" cy="84" rx="3" ry="2" fill="#FFFFFF" stroke="#2D2A32" stroke-width="1.5"/>
                    <ellipse cx="117" cy="84" rx="3" ry="2" fill="#FFFFFF" stroke="#2D2A32" stroke-width="1.5"/>
                  </g>
                </svg>
              }

              @default {
                <!-- Heo Ngủ Khò Bong Bóng Mũi Phập Phồng & Chữ Zzz Bay Lên 💤🫧 -->
                <svg viewBox="0 0 140 140" class="w-full h-full">
                  <circle cx="70" cy="72" r="56" fill="#EDE9FE" stroke="#2D2A32" stroke-width="3"/>
                  <path d="M35 44 L24 24 L48 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M105 44 L116 24 L92 34 Z" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4" stroke-linejoin="round"/>
                  <circle cx="70" cy="76" r="42" fill="#FF8FAB" stroke="#2D2A32" stroke-width="4"/>
                  <path d="M43 62 Q50 69 57 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                  <path d="M83 62 Q90 69 97 62" fill="none" stroke="#2D2A32" stroke-width="3.5" stroke-linecap="round"/>
                  <ellipse cx="70" cy="80" rx="15" ry="10" fill="#FFB3C6" stroke="#2D2A32" stroke-width="3.5"/>
                  <circle cx="65" cy="80" r="2.5" fill="#2D2A32"/>
                  <circle cx="75" cy="80" r="2.5" fill="#2D2A32"/>
                  <circle
                    class="animate-snot-bubble"
                    cx="96"
                    cy="76"
                    r="10"
                    fill="#E0F2FE"
                    stroke="#2D2A32"
                    stroke-width="2.5"
                  />
                  <text x="95" y="42" class="animate-zzz-1" font-family="Baloo 2, cursive" font-weight="800" font-size="16" fill="#2D2A32">Zzz</text>
                  <text x="104" y="32" class="animate-zzz-2" font-family="Baloo 2, cursive" font-weight="800" font-size="13" fill="#6D28D9">zZ</text>
                </svg>
              }
            }
          </div>

          <!-- Compact 1-Line Sticker Nameplate overlapping bottom of Piggy Avatar -->
          <div
            class="-mt-2 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#2D2A32] bg-white shadow-[0_2px_0_#2D2A32] whitespace-nowrap"
          >
            <span class="text-sm leading-none">{{ currentLine().emoji }}</span>
            <span class="font-display font-extrabold text-[11px] uppercase tracking-wider text-[#2D2A32]">
              {{ currentLine().badge }}
            </span>
          </div>
        </div>

        <!-- Speech Bubble Quote & Subtext (text-balance prevents 1-word orphan lines!) -->
        <div class="flex-1 text-center sm:text-left space-y-2">
          <h2 class="font-display font-extrabold text-lg sm:text-2xl text-[#2D2A32] leading-snug text-balance">
            "{{ currentLine().quote }}"
          </h2>

          <p class="text-xs sm:text-sm font-bold text-[#2D2A32]/75 leading-relaxed text-pretty">
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
  readonly popping = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mood']) {
      this.moodSignal.set(this.mood);
      const pool = MOOD_QUOTES[this.mood] || MOOD_QUOTES.SLEEPY;
      this.quoteIndex.set(Math.floor(Math.random() * pool.length));
      this.triggerJellyPop();
    } else if (changes['triggerCount']) {
      this.nextRandomQuote();
    }
  }

  nextRandomQuote(): void {
    const pool = MOOD_QUOTES[this.moodSignal()] || MOOD_QUOTES.SLEEPY;
    if (pool.length > 1) {
      const current = this.quoteIndex();
      let next = Math.floor(Math.random() * pool.length);
      if (next === current) {
        next = (current + 1) % pool.length;
      }
      this.quoteIndex.set(next);
    }
    this.triggerJellyPop();
  }

  private triggerJellyPop(): void {
    this.popping.set(false);
    setTimeout(() => {
      this.popping.set(true);
      setTimeout(() => this.popping.set(false), 560);
    }, 10);
  }

  readonly currentLine = computed(() => {
    const m = this.moodSignal();
    const pool = MOOD_QUOTES[m] || MOOD_QUOTES.SLEEPY;
    const item = pool[this.quoteIndex() % pool.length] || pool[0];
    return item;
  });
}
