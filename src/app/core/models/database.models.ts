export type FamilyRole = 'OWNER' | 'MEMBER';
export type OwnerScope = 'WIFE' | 'HUSBAND' | 'SHARED';
export type WalletType = 'BANK' | 'CASH' | 'EWALLET' | 'OTHER';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TxStatus = 'DONE' | 'RETURNED';
export type DebtLoanType = 'LEND' | 'DEBT';
export type DebtLoanStatus = 'OPEN' | 'PAID';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  invite_locked: boolean;
  created_by: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  role: FamilyRole;
  nickname: string;
  joined_at: string;
  profiles?: Profile;
}

export interface Wallet {
  id: string;
  family_id: string;
  name: string;
  owner_scope: OwnerScope;
  wallet_type: WalletType;
  initial_balance: number;
  is_archived: boolean;
}

export interface WalletBalance {
  wallet_id: string;
  family_id: string;
  name: string;
  owner_scope: OwnerScope;
  wallet_type: WalletType;
  initial_balance: number;
  current_balance: number;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  type: CategoryType;
  is_refundable: boolean;
  color: string;
  icon: string;
  is_archived: boolean;
}

export interface Transaction {
  id: string;
  family_id: string;
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
  status: TxStatus;
  refunded_amount: number | null;
  refund_wallet_id: string | null;
  refunded_at: string | null;
  is_locked: boolean;
  locked_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
}

export interface DebtLoan {
  id: string;
  family_id: string;
  type: DebtLoanType;
  counterparty: string;
  principal_amount: number;
  paid_amount: number;
  wallet_id: string;
  actor?: OwnerScope;
  affects_balance: boolean;
  transaction_date: string;
  due_date: string | null;
  status: DebtLoanStatus;
  note: string | null;
  is_locked: boolean;
  locked_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
}

export interface Repayment {
  id: string;
  family_id: string;
  debt_loan_id: string;
  wallet_id: string;
  amount: number;
  paid_date: string;
  note: string | null;
  created_by: string | null;
}

export interface MonthlyCashflowSummary {
  family_id: string;
  month_start: string;
  actor?: OwnerScope;
  total_income: number;
  total_expense: number;
}

export interface CreateFamilyResult {
  family_id: string;
  invite_code: string;
}

export const OWNER_SCOPE_META: Record<
  OwnerScope,
  { label: string; emoji: string; badgeBg: string; badgeBorder: string; textColor: string }
> = {
  WIFE: {
    label: 'Vợ yêu',
    emoji: '🐱',
    badgeBg: '#FFE4E6',
    badgeBorder: '#BE123C',
    textColor: '#BE123C',
  },
  HUSBAND: {
    label: 'Chồng yêu',
    emoji: '🐶',
    badgeBg: '#E0F2FE',
    badgeBorder: '#0369A1',
    textColor: '#0369A1',
  },
  SHARED: {
    label: 'Quỹ chung',
    emoji: '🐷',
    badgeBg: '#FEF3C7',
    badgeBorder: '#B45309',
    textColor: '#B45309',
  },
};

export const WALLET_TYPE_META: Record<
  WalletType,
  { label: string; emoji: string; color: string }
> = {
  BANK: { label: 'Ngân hàng', emoji: '🏦', color: '#38BDF8' },
  CASH: { label: 'Tiền mặt', emoji: '💵', color: '#22C55E' },
  EWALLET: { label: 'Ví điện tử', emoji: '📱', color: '#FF8FAB' },
  OTHER: { label: 'Khác', emoji: '🪙', color: '#FFB020' },
};
