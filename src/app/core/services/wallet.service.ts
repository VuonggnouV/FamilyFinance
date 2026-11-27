import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FamilyService } from './family.service';
import {
  Wallet,
  WalletBalance,
  OwnerScope,
  WalletType,
} from '../models/database.models';

export interface WalletWithBalance extends Wallet {
  current_balance: number;
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly supabase = inject(SupabaseService);
  private readonly familyService = inject(FamilyService);

  readonly wallets = signal<Wallet[]>([]);
  readonly walletBalances = signal<WalletBalance[]>([]);
  readonly loading = signal<boolean>(false);

  readonly walletsWithBalance = computed<WalletWithBalance[]>(() => {
    const rawWallets = this.wallets();
    const balances = this.walletBalances();
    const balMap = new Map<string, number>();
    for (const b of balances) {
      balMap.set(b.wallet_id, Number(b.current_balance ?? b.initial_balance ?? 0));
    }

    return rawWallets.map((w) => ({
      ...w,
      initial_balance: Number(w.initial_balance ?? 0),
      current_balance: balMap.has(w.id)
        ? balMap.get(w.id)!
        : Number(w.initial_balance ?? 0),
    }));
  });

  readonly activeWallets = computed(() =>
    this.walletsWithBalance().filter((w) => !w.is_archived)
  );

  readonly totalBalance = computed(() =>
    this.activeWallets().reduce((sum, w) => sum + Number(w.current_balance || 0), 0)
  );

  readonly balanceByOwner = computed<Record<OwnerScope, number>>(() => {
    const result: Record<OwnerScope, number> = {
      WIFE: 0,
      HUSBAND: 0,
      SHARED: 0,
    };
    for (const w of this.activeWallets()) {
      result[w.owner_scope] =
        (result[w.owner_scope] || 0) + Number(w.current_balance || 0);
    }
    return result;
  });

  async loadWallets(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.loading.set(true);
    try {
      const [walletsRes, balancesRes] = await Promise.all([
        this.supabase.client
          .from('wallets')
          .select('*')
          .eq('family_id', familyId)
          .order('is_archived', { ascending: true })
          .order('name', { ascending: true }),
        this.supabase.client
          .from('wallet_balances')
          .select('*')
          .eq('family_id', familyId),
      ]);

      if (walletsRes.error) throw walletsRes.error;
      this.wallets.set((walletsRes.data ?? []) as Wallet[]);

      if (!balancesRes.error && balancesRes.data) {
        this.walletBalances.set(balancesRes.data as WalletBalance[]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  getWalletById(id: string | null | undefined): WalletWithBalance | undefined {
    if (!id) return undefined;
    return this.walletsWithBalance().find((w) => w.id === id);
  }

  async createWallet(payload: {
    name: string;
    owner_scope: OwnerScope;
    wallet_type: WalletType;
    initial_balance: number;
  }): Promise<Wallet> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('Chưa chọn gia đình');

    const { data, error } = await this.supabase.client
      .from('wallets')
      .insert({
        family_id: familyId,
        name: payload.name.trim(),
        owner_scope: payload.owner_scope,
        wallet_type: payload.wallet_type,
        initial_balance: Math.round(Number(payload.initial_balance || 0)),
        is_archived: false,
      })
      .select()
      .single();

    if (error) throw error;
    const created = data as Wallet;
    this.wallets.update((list) => [...list, created]);
    void this.loadWallets();
    return created;
  }

  async updateWallet(
    id: string,
    payload: Partial<{
      name: string;
      owner_scope: OwnerScope;
      wallet_type: WalletType;
      initial_balance: number;
      is_archived: boolean;
    }>
  ): Promise<void> {
    const updateData: Record<string, any> = { ...payload };
    if (typeof updateData['name'] === 'string') {
      updateData['name'] = updateData['name'].trim();
    }
    if (updateData['initial_balance'] !== undefined) {
      updateData['initial_balance'] = Math.round(
        Number(updateData['initial_balance'] || 0)
      );
    }

    const { error } = await this.supabase.client
      .from('wallets')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    this.wallets.update((list) =>
      list.map((w) => (w.id === id ? ({ ...w, ...updateData } as Wallet) : w))
    );
    void this.loadWallets();
  }

  async deleteWallet(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('wallets')
      .delete()
      .eq('id', id);

    if (error) {
      if (
        error.code === '23503' ||
        error.message?.toLowerCase().includes('foreign key')
      ) {
        const friendlyError = new Error(
          'Không thể xóa vì đã có giao dịch gắn với mục này. Bạn có thể chọn Ẩn (Lưu trữ) thay thế.'
        );
        (friendlyError as any).code = '23503';
        throw friendlyError;
      }
      throw error;
    }

    await this.loadWallets();
  }
}
