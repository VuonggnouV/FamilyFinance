import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FamilyService } from './family.service';
import { WalletService } from './wallet.service';
import {
  Transaction,
  TxType,
  OwnerScope,
  MonthlyCashflowSummary,
} from '../models/database.models';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly supabase = inject(SupabaseService);
  private readonly familyService = inject(FamilyService);
  private readonly walletService = inject(WalletService);

  readonly transactions = signal<Transaction[]>([]);
  readonly monthlySummaries = signal<MonthlyCashflowSummary[]>([]);
  readonly loading = signal<boolean>(false);

  /** Earliest transaction date in DB (YYYY-MM-DD) for smart filter range default */
  readonly earliestTransactionDate = computed<string>(() => {
    const list = this.transactions();
    if (list.length === 0) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }
    let minDate = list[0].transaction_date;
    for (const tx of list) {
      if (tx.transaction_date && tx.transaction_date < minDate) {
        minDate = tx.transaction_date;
      }
    }
    return minDate.slice(0, 7) + '-01';
  });

  /**
   * Computes the exact wallet balance of `tx.wallet_id` immediately after each transaction,
   * walking backward from the live `current_balance` of each wallet.
   */
  readonly runningBalanceByTxId = computed<Map<string, number>>(() => {
    const wallets = this.walletService.walletsWithBalance();
    const txs = this.transactions(); // already ordered newest -> oldest
    const cursor = new Map<string, number>();

    for (const w of wallets) {
      cursor.set(w.id, Number(w.current_balance || 0));
    }

    const result = new Map<string, number>();

    for (const tx of txs) {
      const wId = tx.wallet_id;
      const currentBal = cursor.get(wId) ?? 0;
      // Record the balance of tx.wallet_id right after this transaction completed
      result.set(tx.id, currentBal);

      const amt = Number(tx.amount || 0);
      if (tx.type === 'INCOME') {
        // Reverse INCOME: before tx, balance was lower by amt
        cursor.set(wId, currentBal - amt);
      } else if (tx.type === 'EXPENSE') {
        // If RETURNED, reverse the refund on refund_wallet_id first
        if (tx.status === 'RETURNED') {
          const refAmt = Number(tx.refunded_amount ?? amt);
          const refWId = tx.refund_wallet_id || wId;
          cursor.set(refWId, (cursor.get(refWId) ?? 0) - refAmt);
        }
        // Reverse EXPENSE: before tx, balance was higher by amt
        cursor.set(wId, (cursor.get(wId) ?? 0) + amt);
      } else if (tx.type === 'TRANSFER') {
        // Reverse TRANSFER: before tx, source wallet had +amt and target wallet had -amt
        cursor.set(wId, currentBal + amt);
        if (tx.to_wallet_id) {
          cursor.set(
            tx.to_wallet_id,
            (cursor.get(tx.to_wallet_id) ?? 0) - amt
          );
        }
      }
    }

    return result;
  });

  getRunningBalanceAfter(txId: string): number | null {
    const map = this.runningBalanceByTxId();
    return map.has(txId) ? map.get(txId)! : null;
  }

  async loadTransactions(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.loading.set(true);
    try {
      const [txRes, summaryRes] = await Promise.all([
        this.supabase.client
          .from('transactions')
          .select('*')
          .eq('family_id', familyId)
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false }),
        this.supabase.client
          .from('monthly_cashflow_summary')
          .select('*')
          .eq('family_id', familyId)
          .order('month_start', { ascending: true }),
      ]);

      if (txRes.error) {
        const fallbackRes = await this.supabase.client
          .from('transactions')
          .select('*')
          .eq('family_id', familyId)
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false });
        if (fallbackRes.error) throw fallbackRes.error;
        this.transactions.set(
          (fallbackRes.data ?? []).map((t: any) => this.normalizeTx(t))
        );
      } else {
        this.transactions.set(
          (txRes.data ?? []).map((t: any) => this.normalizeTx(t))
        );
      }

      if (!summaryRes.error && summaryRes.data) {
        this.monthlySummaries.set(
          summaryRes.data.map((s: any) => ({
            ...s,
            total_income: Number(s.total_income || 0),
            total_expense: Number(s.total_expense || 0),
          }))
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  private normalizeTx(t: any): Transaction {
    return {
      ...t,
      amount: Number(t.amount || 0),
      refunded_amount:
        t.refunded_amount !== null && t.refunded_amount !== undefined
          ? Number(t.refunded_amount)
          : null,
    };
  }

  async createTransaction(payload: {
    type: TxType;
    amount: number;
    wallet_id: string;
    to_wallet_id?: string | null;
    category_id?: string | null;
    actor?: OwnerScope;
    title: string;
    note?: string | null;
    transaction_date: string;
    is_refundable?: boolean;
  }): Promise<Transaction> {
    const familyId = this.familyService.familyId();
    const user = this.supabase.currentUser();
    if (!familyId) throw new Error('Chưa chọn gia đình');

    const baseRow: Record<string, any> = {
      family_id: familyId,
      type: payload.type,
      amount: Math.round(Number(payload.amount)),
      wallet_id: payload.wallet_id,
      to_wallet_id:
        payload.type === 'TRANSFER' ? payload.to_wallet_id || null : null,
      category_id:
        payload.type === 'TRANSFER' ? null : payload.category_id || null,
      title: payload.title.trim(),
      note: payload.note?.trim() || null,
      transaction_date: payload.transaction_date,
      is_refundable:
        payload.type === 'EXPENSE' ? Boolean(payload.is_refundable) : false,
      status: 'DONE',
      created_by: user?.id ?? null,
    };

    // Compatible both before AND after dropping 'actor' column in Supabase
    let { data, error } = await this.supabase.client
      .from('transactions')
      .insert(baseRow)
      .select()
      .single();

    if (error && (error.code === '23502' || error.message?.includes('actor'))) {
      const walletScope =
        payload.actor ??
        this.walletService.getWalletById(payload.wallet_id)?.owner_scope ??
        'SHARED';
      const retry = await this.supabase.client
        .from('transactions')
        .insert({ ...baseRow, actor: walletScope })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    const createdTx = this.normalizeTx(data);
    this.transactions.update((list) => [createdTx, ...list]);
    // Refresh in background so UI modal closes immediately without duplicate taps
    void Promise.all([this.loadTransactions(), this.walletService.loadWallets()]);
    return createdTx;
  }

  async updateTransaction(
    id: string,
    payload: Partial<{
      type: TxType;
      amount: number;
      wallet_id: string;
      to_wallet_id: string | null;
      category_id: string | null;
      actor?: OwnerScope;
      title: string;
      note: string | null;
      transaction_date: string;
      is_refundable: boolean;
    }>
  ): Promise<void> {
    const user = this.supabase.currentUser();
    const updateRow: Record<string, any> = {
      ...payload,
      updated_by: user?.id ?? null,
    };
    delete updateRow['actor'];

    if (updateRow['amount'] !== undefined) {
      updateRow['amount'] = Math.round(Number(updateRow['amount']));
    }
    if (typeof updateRow['title'] === 'string') {
      updateRow['title'] = updateRow['title'].trim();
    }

    const { error } = await this.supabase.client
      .from('transactions')
      .update(updateRow)
      .eq('id', id);

    if (error) throw error;
    this.transactions.update((list) =>
      list.map((t) => (t.id === id ? ({ ...t, ...updateRow } as Transaction) : t))
    );
    void Promise.all([this.loadTransactions(), this.walletService.loadWallets()]);
  }

  /**
   * Soft delete transaction via RPC soft_delete_transaction({ p_tx_id })
   */
  async softDeleteTransaction(txId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('soft_delete_transaction', {
      p_tx_id: txId,
    });
    if (error) throw error;
    await Promise.all([this.loadTransactions(), this.walletService.loadWallets()]);
  }

  /**
   * Refund transaction via RPC refund_transaction({ p_tx_id, p_refund_amount, p_refund_wallet_id })
   * Pass p_refund_amount: null when user clicks "Hoàn toàn bộ"
   */
  async refundTransaction(params: {
    p_tx_id: string;
    p_refund_amount: number | null;
    p_refund_wallet_id: string;
  }): Promise<Transaction> {
    const { data, error } = await this.supabase.client.rpc(
      'refund_transaction',
      {
        p_tx_id: params.p_tx_id,
        p_refund_amount:
          params.p_refund_amount === null
            ? null
            : Math.round(Number(params.p_refund_amount)),
        p_refund_wallet_id: params.p_refund_wallet_id,
      }
    );

    if (error) throw error;
    void Promise.all([this.loadTransactions(), this.walletService.loadWallets()]);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.normalizeTx(row) : ({} as Transaction);
  }

  /**
   * Undo refund within 10s via RPC undo_refund_transaction({ p_tx_id })
   */
  async undoRefundTransaction(txId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc(
      'undo_refund_transaction',
      {
        p_tx_id: txId,
      }
    );
    if (error) throw error;
    await Promise.all([this.loadTransactions(), this.walletService.loadWallets()]);
  }
}
