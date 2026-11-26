import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FamilyService } from './family.service';
import { WalletService } from './wallet.service';
import {
  DebtLoan,
  DebtLoanType,
  OwnerScope,
  Repayment,
} from '../models/database.models';

@Injectable({
  providedIn: 'root',
})
export class DebtLoanService {
  private readonly supabase = inject(SupabaseService);
  private readonly familyService = inject(FamilyService);
  private readonly walletService = inject(WalletService);

  readonly items = signal<DebtLoan[]>([]);
  readonly repayments = signal<Repayment[]>([]);
  readonly loading = signal<boolean>(false);

  readonly lends = computed(() =>
    this.items().filter((i) => i.type === 'LEND')
  );

  readonly debts = computed(() =>
    this.items().filter((i) => i.type === 'DEBT')
  );

  readonly totalOpenLend = computed(() =>
    this.lends()
      .filter((i) => i.status === 'OPEN')
      .reduce(
        (sum, i) =>
          sum + Math.max(0, Number(i.principal_amount) - Number(i.paid_amount)),
        0
      )
  );

  readonly totalOpenDebt = computed(() =>
    this.debts()
      .filter((i) => i.status === 'OPEN')
      .reduce(
        (sum, i) =>
          sum + Math.max(0, Number(i.principal_amount) - Number(i.paid_amount)),
        0
      )
  );

  /** Items due within 7 days or overdue (status === 'OPEN' and due_date present) */
  readonly dueReminders = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.items()
      .filter((item) => item.status === 'OPEN' && !!item.due_date)
      .map((item) => {
        const due = new Date(item.due_date! + 'T00:00:00');
        const diffDays = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          item,
          diffDays,
          isOverdue: diffDays < 0,
          isDueSoon: diffDays >= 0 && diffDays <= 7,
        };
      })
      .filter((r) => r.isOverdue || r.isDueSoon)
      .sort((a, b) => a.diffDays - b.diffDays);
  });

  async loadDebtsLoans(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.loading.set(true);
    try {
      const [dlRes, repRes] = await Promise.all([
        this.supabase.client
          .from('debts_loans')
          .select('*')
          .eq('family_id', familyId)
          .is('deleted_at', null)
          .order('status', { ascending: true })
          .order('transaction_date', { ascending: false }),
        this.supabase.client
          .from('repayments')
          .select('*')
          .eq('family_id', familyId)
          .order('paid_date', { ascending: false }),
      ]);

      if (dlRes.error) throw dlRes.error;
      this.items.set(
        (dlRes.data ?? []).map((d: any) => ({
          ...d,
          principal_amount: Number(d.principal_amount || 0),
          paid_amount: Number(d.paid_amount || 0),
        }))
      );

      if (!repRes.error && repRes.data) {
        this.repayments.set(
          repRes.data.map((r: any) => ({
            ...r,
            amount: Number(r.amount || 0),
          }))
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  getRepaymentsFor(debtLoanId: string): Repayment[] {
    return this.repayments().filter((r) => r.debt_loan_id === debtLoanId);
  }

  async createDebtLoan(payload: {
    type: DebtLoanType;
    counterparty: string;
    principal_amount: number;
    wallet_id: string;
    actor?: OwnerScope;
    affects_balance: boolean;
    transaction_date: string;
    due_date?: string | null;
    note?: string | null;
  }): Promise<DebtLoan> {
    const familyId = this.familyService.familyId();
    const user = this.supabase.currentUser();
    if (!familyId) throw new Error('Chưa chọn gia đình');

    const baseRow: Record<string, any> = {
      family_id: familyId,
      type: payload.type,
      counterparty: payload.counterparty.trim(),
      principal_amount: Math.round(Number(payload.principal_amount)),
      paid_amount: 0,
      wallet_id: payload.wallet_id,
      affects_balance:
        payload.type === 'DEBT' ? Boolean(payload.affects_balance) : true,
      transaction_date: payload.transaction_date,
      due_date: payload.due_date || null,
      status: 'OPEN',
      note: payload.note?.trim() || null,
      created_by: user?.id ?? null,
    };

    // Compatible both before AND after dropping 'actor' column in Supabase
    let { data, error } = await this.supabase.client
      .from('debts_loans')
      .insert(baseRow)
      .select()
      .single();

    if (error && (error.code === '23502' || error.message?.includes('actor'))) {
      const walletScope =
        payload.actor ??
        this.walletService.getWalletById(payload.wallet_id)?.owner_scope ??
        'SHARED';
      const retry = await this.supabase.client
        .from('debts_loans')
        .insert({ ...baseRow, actor: walletScope })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    void Promise.all([this.loadDebtsLoans(), this.walletService.loadWallets()]);
    return data as DebtLoan;
  }

  async updateDebtLoan(
    id: string,
    payload: Partial<{
      counterparty: string;
      principal_amount: number;
      wallet_id: string;
      actor?: OwnerScope;
      affects_balance: boolean;
      transaction_date: string;
      due_date: string | null;
      note: string | null;
    }>
  ): Promise<void> {
    const user = this.supabase.currentUser();
    const updateRow: Record<string, any> = {
      ...payload,
      updated_by: user?.id ?? null,
    };
    delete updateRow['actor'];

    if (updateRow['principal_amount'] !== undefined) {
      updateRow['principal_amount'] = Math.round(
        Number(updateRow['principal_amount'])
      );
    }
    if (typeof updateRow['counterparty'] === 'string') {
      updateRow['counterparty'] = updateRow['counterparty'].trim();
    }

    const { error } = await this.supabase.client
      .from('debts_loans')
      .update(updateRow)
      .eq('id', id);

    if (error) throw error;
    void Promise.all([this.loadDebtsLoans(), this.walletService.loadWallets()]);
  }

  async deleteDebtLoan(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('debts_loans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      const { error: delErr } = await this.supabase.client
        .from('debts_loans')
        .delete()
        .eq('id', id);
      if (delErr) throw delErr;
    }

    await Promise.all([this.loadDebtsLoans(), this.walletService.loadWallets()]);
  }

  async recordRepayment(params: {
    p_debt_loan_id: string;
    p_amount: number;
    p_wallet_id: string;
    p_paid_date: string;
    p_note?: string | null;
  }): Promise<{ repaymentId: string | null; settled: boolean }> {
    const prevIds = new Set(
      this.getRepaymentsFor(params.p_debt_loan_id).map((r) => r.id)
    );

    const { data, error } = await this.supabase.client.rpc('record_repayment', {
      p_debt_loan_id: params.p_debt_loan_id,
      p_amount: Math.round(Number(params.p_amount)),
      p_wallet_id: params.p_wallet_id,
      p_paid_date: params.p_paid_date,
      p_note: params.p_note?.trim() || null,
    });

    if (error) throw error;

    await Promise.all([this.loadDebtsLoans(), this.walletService.loadWallets()]);

    let repaymentId: string | null = null;
    if (typeof data === 'string') {
      repaymentId = data;
    } else if (data && typeof data === 'object') {
      const row = Array.isArray(data) ? data[0] : data;
      repaymentId = row?.id ?? row?.repayment_id ?? null;
    }

    if (!repaymentId) {
      const currentReps = this.getRepaymentsFor(params.p_debt_loan_id);
      const newlyAdded = currentReps.find((r) => !prevIds.has(r.id));
      repaymentId = newlyAdded?.id ?? currentReps[0]?.id ?? null;
    }

    const updatedItem = this.items().find((i) => i.id === params.p_debt_loan_id);
    const settled =
      updatedItem?.status === 'PAID' ||
      Boolean(
        updatedItem &&
          Number(updatedItem.paid_amount) >= Number(updatedItem.principal_amount)
      );

    return { repaymentId, settled };
  }

  async undoRepayment(repaymentId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('repayments')
      .delete()
      .eq('id', repaymentId);

    if (error) throw error;
    await Promise.all([this.loadDebtsLoans(), this.walletService.loadWallets()]);
  }
}
