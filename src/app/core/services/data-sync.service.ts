import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FamilyService } from './family.service';
import { WalletService } from './wallet.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { DebtLoanService } from './debt-loan.service';

@Injectable({
  providedIn: 'root',
})
export class DataSyncService {
  private readonly supabase = inject(SupabaseService);
  private readonly familyService = inject(FamilyService);
  private readonly walletService = inject(WalletService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly debtLoanService = inject(DebtLoanService);

  readonly initialLoaded = signal<boolean>(false);
  /** Global quick-add transaction modal trigger (used by Mobile '+' FAB & top buttons) */
  readonly quickTransactionModalOpen = signal<boolean>(false);
  readonly quickTransactionDefaultType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.supabase.realtimeChanges$.subscribe((table) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleRealtimeChange(table);
      }, 250);
    });
  }

  async loadAllFamilyData(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    await Promise.all([
      this.walletService.loadWallets(),
      this.categoryService.loadCategories(),
      this.transactionService.loadTransactions(),
      this.debtLoanService.loadDebtsLoans(),
    ]);
    this.initialLoaded.set(true);
  }

  openQuickAdd(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'): void {
    this.quickTransactionDefaultType.set(type);
    this.quickTransactionModalOpen.set(true);
  }

  closeQuickAdd(): void {
    this.quickTransactionModalOpen.set(false);
  }

  private async handleRealtimeChange(
    table: 'transactions' | 'wallets' | 'debts_loans' | 'repayments'
  ): Promise<void> {
    if (!this.familyService.familyId()) return;

    switch (table) {
      case 'transactions':
        await Promise.all([
          this.transactionService.loadTransactions(),
          this.walletService.loadWallets(),
        ]);
        break;
      case 'wallets':
        await this.walletService.loadWallets();
        break;
      case 'debts_loans':
      case 'repayments':
        await Promise.all([
          this.debtLoanService.loadDebtsLoans(),
          this.walletService.loadWallets(),
        ]);
        break;
    }
  }
}
