import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vnd',
  standalone: true,
})
export class VndPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    showSymbol = true,
    showSign: 'none' | 'plus' | 'minus' = 'none'
  ): string {
    const num = Number(value ?? 0);
    if (isNaN(num)) return showSymbol ? '0 ₫' : '0';

    const absFormatted = Math.abs(Math.round(num))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let prefix = '';
    if (num < 0) {
      prefix = '-';
    } else if (showSign === 'plus' && num > 0) {
      prefix = '+';
    } else if (showSign === 'minus' && num > 0) {
      prefix = '-';
    }

    return showSymbol
      ? `${prefix}${absFormatted} ₫`
      : `${prefix}${absFormatted}`;
  }
}

export function formatVndInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseVndInput(formatted: string | number | null | undefined): number {
  if (formatted === null || formatted === undefined) return 0;
  if (typeof formatted === 'number') return Math.round(formatted);
  const digits = formatted.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Multiply current input by 1,000 (append 3 zeros: e.g. 23 -> 23.000)
 */
export function appendThreeZeros(formatted: string | number | null | undefined): string {
  const current = parseVndInput(formatted);
  if (current <= 0) return '';
  const next = Math.min(999_999_999_999, current * 1000);
  return formatVndInput(next);
}
