import { Injectable, signal } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User,
  Session,
  RealtimeChannel,
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly authInitialized = signal<boolean>(false);

  private realtimeChannel: RealtimeChannel | null = null;
  private subscribedFamilyId: string | null = null;

  /** Emits table name whenever Supabase Realtime detects postgres_changes */
  readonly realtimeChanges$ = new Subject<'transactions' | 'wallets' | 'debts_loans' | 'repayments'>();

  constructor() {
    // Normalize URL in case environment.supabaseUrl includes /rest/v1/
    const cleanUrl = environment.supabaseUrl
      .replace(/\/rest\/v1\/?$/, '')
      .replace(/\/$/, '');

    this.client = createClient(cleanUrl, environment.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    this.initAuthListener();
  }

  private async initAuthListener(): Promise<void> {
    try {
      const { data } = await this.client.auth.getSession();
      this.currentSession.set(data.session);
      this.currentUser.set(data.session?.user ?? null);
    } catch {
      this.currentSession.set(null);
      this.currentUser.set(null);
    } finally {
      this.authInitialized.set(true);
    }

    this.client.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      this.authInitialized.set(true);
      if (!session) {
        this.unsubscribeRealtime();
      }
    });
  }

  /**
   * Subscribe to Supabase Realtime postgres_changes on 4 core tables
   * filtered by the active family_id so husband & wife screens sync instantly.
   */
  subscribeFamilyRealtime(familyId: string): void {
    if (!familyId) return;
    if (this.subscribedFamilyId === familyId && this.realtimeChannel) {
      return;
    }

    this.unsubscribeRealtime();
    this.subscribedFamilyId = familyId;

    const filter = `family_id=eq.${familyId}`;
    this.realtimeChannel = this.client
      .channel(`family-sync-${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter },
        () => this.realtimeChanges$.next('transactions')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter },
        () => this.realtimeChanges$.next('wallets')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts_loans', filter },
        () => this.realtimeChanges$.next('debts_loans')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repayments', filter },
        () => this.realtimeChanges$.next('repayments')
      )
      .subscribe();
  }

  unsubscribeRealtime(): void {
    if (this.realtimeChannel) {
      this.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.subscribedFamilyId = null;
  }
}
