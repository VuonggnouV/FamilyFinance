import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root',
})
export class ConfettiService {
  /**
   * Celebratory confetti burst when:
   * - Adding new INCOME ("Ting ting lúa về!")
   * - Completing LEND repayment
   * - Refunding an expense successfully
   */
  celebrate(): void {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#22C55E', '#FFB020', '#FF8FAB', '#38BDF8', '#9B6BFF'],
      });
    } catch {
      // Ignore if canvas is unavailable
    }
  }
}
