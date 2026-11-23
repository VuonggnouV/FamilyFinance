import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  readonly user = this.supabase.currentUser;
  readonly session = this.supabase.currentSession;
  readonly initialized = this.supabase.authInitialized;

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }

  async signUp(email: string, password: string, displayName: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          full_name: displayName.trim(),
        },
      },
    });
    if (error) throw error;

    // Update profiles table if session is immediately active
    if (data.user) {
      await this.supabase.client
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            display_name: displayName.trim(),
          },
          { onConflict: 'id' }
        );
    }
  }

  async signOut(): Promise<void> {
    this.supabase.unsubscribeRealtime();
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
  }
}
