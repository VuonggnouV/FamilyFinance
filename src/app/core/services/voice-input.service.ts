import { Injectable, signal } from '@angular/core';

export interface ParsedVoiceTransaction {
  title: string;
  amount: number | null;
  rawText: string;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceInputService {
  readonly isSupported = signal<boolean>(this.checkSupport());
  readonly isListening = signal<boolean>(false);
  readonly interimTranscript = signal<string>('');

  private recognition: any = null;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Start Vietnamese speech recognition (`vi-VN`).
   * Calls `onTranscript(text, isFinal)` continuously as the user speaks.
   */
  startListening(options: {
    onTranscript: (text: string, isFinal: boolean) => void;
    onEnd?: (finalText: string) => void;
    onError?: (errMessage: string) => void;
  }): boolean {
    if (!this.checkSupport()) {
      options.onError?.(
        'Trình duyệt này chưa hỗ trợ nhận diện giọng nói (Hãy dùng Safari, Chrome hoặc Edge).'
      );
      return false;
    }

    this.stopListeningImmediate();

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'vi-VN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let latestText = '';

      recognition.onstart = () => {
        this.isListening.set(true);
        this.interimTranscript.set('');
      };

      recognition.onresult = (event: any) => {
        let combined = '';
        let hasFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          combined += res[0]?.transcript ?? '';
          if (res.isFinal) {
            hasFinal = true;
          }
        }

        const cleaned = combined.trim();
        if (cleaned) {
          latestText = cleaned;
          this.interimTranscript.set(cleaned);
          options.onTranscript(cleaned, hasFinal);
        }
      };

      recognition.onerror = (event: any) => {
        const code = event?.error;
        this.isListening.set(false);
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          options.onError?.(
            'Vui lòng cho phép quyền Micro 🎙️ trên trình duyệt để nhập bằng giọng nói nhé!'
          );
        } else if (code !== 'aborted' && code !== 'no-speech') {
          options.onError?.('Không nghe rõ, bạn thử giữ mic nói lại nhé!');
        }
      };

      recognition.onend = () => {
        this.isListening.set(false);
        if (this.recognition === recognition) {
          this.recognition = null;
        }
        options.onEnd?.(latestText);
      };

      this.recognition = recognition;
      recognition.start();
      return true;
    } catch {
      this.isListening.set(false);
      options.onError?.('Không thể khởi động Micro. Hãy thử lại nhé!');
      return false;
    }
  }

  /**
   * Stop listening with a slight buffer (default 280ms) so the final syllable
   * spoken right as the user lifts their finger is not clipped.
   */
  stopListening(graceMs = 280): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    if (!this.recognition) {
      this.isListening.set(false);
      return;
    }

    const activeRec = this.recognition;
    if (graceMs <= 0) {
      try {
        activeRec.stop();
      } catch {
        // ignore
      }
      this.isListening.set(false);
      return;
    }

    this.stopTimeout = setTimeout(() => {
      try {
        activeRec.stop();
      } catch {
        // ignore
      }
    }, graceMs);
  }

  stopListeningImmediate(): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }
    this.isListening.set(false);
  }

  /**
   * Parse a spoken Vietnamese phrase into `{ title, amount }`.
   * Examples:
   * - "Ăn phở bò 55 nghìn" -> { title: "Ăn phở bò", amount: 55000 }
   * - "Mua bỉm sữa Shopee 250k" -> { title: "Mua bỉm sữa Shopee", amount: 250000 }
   * - "Tiền nhà 4 triệu rưỡi" -> { title: "Tiền nhà", amount: 4500000 }
   * - "Cà phê 35.000đ" -> { title: "Cà phê", amount: 35000 }
   * - "Đổ xăng 70" -> { title: "Đổ xăng", amount: 70000 }
   */
  parseSmartVoiceTransaction(rawSpeech: string): ParsedVoiceTransaction {
    const rawText = (rawSpeech || '').trim();
    if (!rawText) {
      return { title: '', amount: null, rawText: '' };
    }

    // Normalize common Vietnamese number words at the tail if spoken as words
    const normalized = this.normalizeVietnameseSpokenNumbers(rawText);

    // 1. Pattern: X triệu Y (nghìn/ngàn/trăm)? | X triệu rưỡi | X củ rưỡi
    const millionRegex =
      /(\d+(?:[.,]\d+)?)\s*(?:triệu|củ|tr|m)\s*(?:(rưỡi)|(\d{1,3})\s*(?:nghìn|ngàn|k|trăm)?)?\s*(?:đồng|vnđ|vnd|đ)?$/i;
    const millionMatch = normalized.match(millionRegex);
    if (millionMatch) {
      const baseMillion = parseFloat(millionMatch[1].replace(',', '.'));
      let amount = Math.round(baseMillion * 1_000_000);
      if (millionMatch[2]) {
        // "rưỡi" -> +500.000
        amount += 500_000;
      } else if (millionMatch[3]) {
        const sub = parseInt(millionMatch[3], 10);
        if (sub < 10) {
          amount += sub * 100_000; // e.g. "1 triệu 2" -> 1.200.000
        } else {
          amount += sub * 1_000; // e.g. "1 triệu 250" -> 1.250.000
        }
      }
      const titlePart = normalized.slice(0, millionMatch.index).trim();
      return {
        title: this.formatTitle(titlePart),
        amount: amount > 0 ? amount : null,
        rawText,
      };
    }

    // 2. Pattern: X trăm (rưỡi | Y mươi | Y)? (nghìn/ngàn/k)?
    const hundredThousandRegex =
      /(\d+)\s*trăm\s*(?:(rưỡi)|(\d{1,2}))?\s*(?:nghìn|ngàn|k|cành)?\s*(?:đồng|vnđ|vnd|đ)?$/i;
    const hundredMatch = normalized.match(hundredThousandRegex);
    if (hundredMatch) {
      const hundreds = parseInt(hundredMatch[1], 10);
      let amount = hundreds * 100_000;
      if (hundredMatch[2]) {
        amount += 50_000; // "2 trăm rưỡi" -> 250.000
      } else if (hundredMatch[3]) {
        const sub = parseInt(hundredMatch[3], 10);
        amount += sub < 10 ? sub * 10_000 : sub * 1_000; // "2 trăm 3" -> 230.000
      }
      const titlePart = normalized.slice(0, hundredMatch.index).trim();
      return {
        title: this.formatTitle(titlePart),
        amount: amount > 0 ? amount : null,
        rawText,
      };
    }

    // 3. Pattern: X chục (nghìn/ngàn/k)?
    const tenThousandRegex =
      /(\d+)\s*chục\s*(?:nghìn|ngàn|k|cành)?\s*(?:đồng|vnđ|vnd|đ)?$/i;
    const tenMatch = normalized.match(tenThousandRegex);
    if (tenMatch) {
      const tens = parseInt(tenMatch[1], 10);
      const amount = tens * 10_000;
      const titlePart = normalized.slice(0, tenMatch.index).trim();
      return {
        title: this.formatTitle(titlePart),
        amount: amount > 0 ? amount : null,
        rawText,
      };
    }

    // 4. Pattern: X nghìn / ngàn / k / cành (e.g. "45 nghìn", "45k", "45 ngàn rưỡi")
    const thousandRegex =
      /(\d+(?:[.,]\d+)?)\s*(?:nghìn|ngàn|k|cành|ng)\s*(rưỡi)?\s*(?:đồng|vnđ|vnd|đ)?$/i;
    const thousandMatch = normalized.match(thousandRegex);
    if (thousandMatch) {
      const rawNumStr = thousandMatch[1];
      // Check if browser formatted 45.000 + "nghìn" or plain 45 + "nghìn"
      const dotFormatted = /^\d{1,3}(\.\d{3})+$/.test(rawNumStr);
      let amount = 0;
      if (dotFormatted) {
        amount = parseInt(rawNumStr.replace(/\./g, ''), 10);
      } else {
        const val = parseFloat(rawNumStr.replace(',', '.'));
        amount = Math.round(val * 1_000);
      }
      if (thousandMatch[2]) {
        amount += 500;
      }
      const titlePart = normalized.slice(0, thousandMatch.index).trim();
      return {
        title: this.formatTitle(titlePart),
        amount: amount > 0 ? amount : null,
        rawText,
      };
    }

    // 5. Pattern: Explicit formatted number or number at the end (e.g. "Ăn trưa 45.000đ", "Ăn trưa 45000", "Ăn trưa 45")
    const trailingNumberRegex =
      /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:đồng|vnđ|vnd|đ|k)?$/i;
    const numMatch = normalized.match(trailingNumberRegex);
    if (numMatch) {
      const digitsOnly = numMatch[1].replace(/\D/g, '');
      let amount = parseInt(digitsOnly, 10);
      if (!isNaN(amount) && amount > 0) {
        // If user said "Ăn sáng 35", auto-scale < 1000 to thousands (35.000)
        if (amount < 1_000) {
          amount *= 1_000;
        }
        const titlePart = normalized.slice(0, numMatch.index).trim();
        return {
          title: this.formatTitle(titlePart),
          amount,
          rawText,
        };
      }
    }

    return {
      title: this.formatTitle(rawText),
      amount: null,
      rawText,
    };
  }

  private normalizeVietnameseSpokenNumbers(text: string): string {
    let s = text;
    // Handle standalone "trăm rưỡi" -> "1 trăm rưỡi", "triệu rưỡi" -> "1 triệu rưỡi"
    s = s.replace(/\btrăm rưỡi\b/gi, '1 trăm rưỡi');
    s = s.replace(/\btriệu rưỡi\b/gi, '1 triệu rưỡi');
    s = s.replace(/\bcủ rưỡi\b/gi, '1 củ rưỡi');

    const wordToDigit: [RegExp, string][] = [
      [/\bmười lăm\b/gi, '15'],
      [/\bhai mươi lăm\b/gi, '25'],
      [/\bba mươi lăm\b/gi, '35'],
      [/\bbốn mươi lăm\b/gi, '45'],
      [/\bnăm mươi lăm\b/gi, '55'],
      [/\bsáu mươi lăm\b/gi, '65'],
      [/\bbảy mươi lăm\b/gi, '75'],
      [/\btám mươi lăm\b/gi, '85'],
      [/\bchín mươi lăm\b/gi, '95'],
      [/\bhai mươi\b/gi, '20'],
      [/\bba mươi\b/gi, '30'],
      [/\bbốn mươi\b/gi, '40'],
      [/\bnăm mươi\b/gi, '50'],
      [/\bsáu mươi\b/gi, '60'],
      [/\bbảy mươi\b/gi, '70'],
      [/\btám mươi\b/gi, '80'],
      [/\bchín mươi\b/gi, '90'],
      [/\bmười\b/gi, '10'],
      [/\bmột\b/gi, '1'],
      [/\bhai\b/gi, '2'],
      [/\bba\b/gi, '3'],
      [/\bbốn\b/gi, '4'],
      [/\bnăm\b/gi, '5'],
      [/\bsáu\b/gi, '6'],
      [/\bbảy\b/gi, '7'],
      [/\btám\b/gi, '8'],
      [/\bchín\b/gi, '9'],
    ];

    for (const [regex, digit] of wordToDigit) {
      s = s.replace(
        new RegExp(
          `${regex.source}(?=\\s*(?:triệu|củ|trăm|chục|nghìn|ngàn|k|cành|rưỡi))`,
          'gi'
        ),
        digit
      );
    }

    return s;
  }

  public formatTitle(str: string): string {
    const cleaned = str
      .replace(/[-–—,:;.]+$/g, '')
      .replace(/\s+(hết|giá|khoảng|tầm|mất)$/i, '')
      .trim();
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Parse spoken Vietnamese for Lend / Debt creation.
   * Examples:
   * - "Cho bạn Tuấn mượn 2 triệu" -> { counterparty: "Bạn Tuấn", amount: 2000000 }
   * - "Nợ thẻ tín dụng VPBank 3 triệu rưỡi" -> { counterparty: "Thẻ tín dụng VPBank", amount: 3500000 }
   * - "Mượn anh Hùng 500 nghìn" -> { counterparty: "Anh Hùng", amount: 500000 }
   */
  public parseSmartDebtLoan(rawSpeech: string): {
    counterparty: string;
    amount: number | null;
    rawText: string;
  } {
    const base = this.parseSmartVoiceTransaction(rawSpeech);
    let name = base.title.trim();

    // Strip leading/trailing "Cho ... mượn/vay" or "Nợ / Mượn / Vay ..."
    const choMuonMatch = name.match(/^cho\s+(.+?)\s+(?:mượn|vay)(?:\s+tiền)?$/i);
    if (choMuonMatch) {
      name = choMuonMatch[1].trim();
    } else {
      const trailingMuonMatch = name.match(/^(.+?)\s+(?:mượn|vay|nợ)(?:\s+tiền)?$/i);
      if (trailingMuonMatch) {
        name = trailingMuonMatch[1].trim();
      } else {
        const leadingVerbMatch = name.match(
          /^(?:cho\s+mượn|cho\s+vay|mượn\s+tiền|vay\s+tiền|nợ\s+tiền|mượn|vay|nợ|cho)\s+(.+)$/i
        );
        if (leadingVerbMatch) {
          name = leadingVerbMatch[1].trim();
        }
      }
    }

    return {
      counterparty: this.formatTitle(name),
      amount: base.amount,
      rawText: base.rawText,
    };
  }
}
