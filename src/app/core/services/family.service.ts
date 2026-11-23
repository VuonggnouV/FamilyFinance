import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Family,
  FamilyMember,
  CreateFamilyResult,
} from '../models/database.models';

@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  private readonly supabase = inject(SupabaseService);

  readonly currentFamily = signal<Family | null>(null);
  readonly currentMembership = signal<FamilyMember | null>(null);
  readonly members = signal<FamilyMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly checkedMembership = signal<boolean>(false);

  readonly hasFamily = computed(() => !!this.currentFamily());
  readonly isOwner = computed(() => this.currentMembership()?.role === 'OWNER');
  readonly familyId = computed(() => this.currentFamily()?.id ?? null);

  async loadCurrentFamily(): Promise<Family | null> {
    const user = this.supabase.currentUser();
    if (!user) {
      this.currentFamily.set(null);
      this.currentMembership.set(null);
      this.members.set([]);
      this.checkedMembership.set(true);
      return null;
    }

    this.loading.set(true);
    try {
      const { data: memberRows, error: memberErr } = await this.supabase.client
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1);

      if (memberErr) throw memberErr;

      if (!memberRows || memberRows.length === 0) {
        this.currentFamily.set(null);
        this.currentMembership.set(null);
        this.members.set([]);
        this.checkedMembership.set(true);
        return null;
      }

      const myMember = memberRows[0] as FamilyMember;
      this.currentMembership.set(myMember);

      const { data: familyData, error: famErr } = await this.supabase.client
        .from('families')
        .select('*')
        .eq('id', myMember.family_id)
        .single();

      if (famErr) throw famErr;

      const family = familyData as Family;
      this.currentFamily.set(family);
      this.supabase.subscribeFamilyRealtime(family.id);

      await this.loadMembers(family.id);
      this.checkedMembership.set(true);
      return family;
    } finally {
      this.loading.set(false);
    }
  }

  async loadMembers(familyId?: string): Promise<void> {
    const fId = familyId ?? this.familyId();
    if (!fId) return;

    const { data, error } = await this.supabase.client
      .from('family_members')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('family_id', fId)
      .order('joined_at', { ascending: true });

    if (!error && data) {
      this.members.set(data as FamilyMember[]);
    } else {
      // Fallback without join if foreign key relation name differs
      const { data: fallback } = await this.supabase.client
        .from('family_members')
        .select('*')
        .eq('family_id', fId)
        .order('joined_at', { ascending: true });
      if (fallback) {
        this.members.set(fallback as FamilyMember[]);
      }
    }
  }

  async createFamily(
    familyName: string,
    nickname: string
  ): Promise<CreateFamilyResult> {
    const { data, error } = await this.supabase.client.rpc('create_family', {
      p_family_name: familyName.trim(),
      p_nickname: nickname.trim(),
    });
    if (error) throw error;

    const result: CreateFamilyResult = Array.isArray(data) ? data[0] : data;
    await this.loadCurrentFamily();
    return result;
  }

  async joinFamilyByCode(inviteCode: string, nickname: string): Promise<string> {
    const { data, error } = await this.supabase.client.rpc(
      'join_family_by_code',
      {
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_nickname: nickname.trim(),
      }
    );
    if (error) throw error;

    await this.loadCurrentFamily();
    return typeof data === 'string' ? data : data?.family_id ?? '';
  }

  async toggleInviteLock(locked: boolean): Promise<void> {
    const fId = this.familyId();
    if (!fId) return;

    const { data, error } = await this.supabase.client
      .from('families')
      .update({ invite_locked: locked })
      .eq('id', fId)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      this.currentFamily.set(data as Family);
    }
  }

  async updateFamilyName(name: string): Promise<void> {
    const fId = this.familyId();
    if (!fId) return;

    const { data, error } = await this.supabase.client
      .from('families')
      .update({ name: name.trim() })
      .eq('id', fId)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      this.currentFamily.set(data as Family);
    }
  }

  async updateMyNickname(nickname: string): Promise<void> {
    const fId = this.familyId();
    const user = this.supabase.currentUser();
    if (!fId || !user) return;

    const { error } = await this.supabase.client
      .from('family_members')
      .update({ nickname: nickname.trim() })
      .eq('family_id', fId)
      .eq('user_id', user.id);

    if (error) throw error;
    await this.loadMembers(fId);
  }

  clearState(): void {
    this.currentFamily.set(null);
    this.currentMembership.set(null);
    this.members.set([]);
    this.checkedMembership.set(false);
  }
}
