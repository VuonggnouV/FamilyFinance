import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FamilyService } from './family.service';
import { Category, CategoryType } from '../models/database.models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly supabase = inject(SupabaseService);
  private readonly familyService = inject(FamilyService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal<boolean>(false);

  readonly activeCategories = computed(() =>
    this.categories().filter((c) => !c.is_archived)
  );

  readonly incomeCategories = computed(() =>
    this.activeCategories().filter((c) => c.type === 'INCOME')
  );

  readonly expenseCategories = computed(() =>
    this.activeCategories().filter((c) => c.type === 'EXPENSE')
  );

  async loadCategories(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('*')
        .eq('family_id', familyId)
        .order('is_archived', { ascending: true })
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      this.categories.set((data ?? []) as Category[]);
    } finally {
      this.loading.set(false);
    }
  }

  getCategoryById(id: string | null | undefined): Category | undefined {
    if (!id) return undefined;
    return this.categories().find((c) => c.id === id);
  }

  async createCategory(payload: {
    name: string;
    type: CategoryType;
    is_refundable: boolean;
    color: string;
    icon: string;
  }): Promise<Category> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('Chưa chọn gia đình');

    const { data, error } = await this.supabase.client
      .from('categories')
      .insert({
        family_id: familyId,
        name: payload.name.trim(),
        type: payload.type,
        is_refundable:
          payload.type === 'EXPENSE' ? Boolean(payload.is_refundable) : false,
        color: payload.color || '#FF8FAB',
        icon: payload.icon || '🛍️',
        is_archived: false,
      })
      .select()
      .single();

    if (error) throw error;
    const created = data as Category;
    this.categories.update((list) => [...list, created]);
    void this.loadCategories();
    return created;
  }

  async updateCategory(
    id: string,
    payload: Partial<{
      name: string;
      type: CategoryType;
      is_refundable: boolean;
      color: string;
      icon: string;
      is_archived: boolean;
    }>
  ): Promise<void> {
    const updateData: Record<string, any> = { ...payload };
    if (typeof updateData['name'] === 'string') {
      updateData['name'] = updateData['name'].trim();
    }

    const { error } = await this.supabase.client
      .from('categories')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    this.categories.update((list) =>
      list.map((c) => (c.id === id ? ({ ...c, ...updateData } as Category) : c))
    );
    void this.loadCategories();
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('categories')
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

    await this.loadCategories();
  }
}
