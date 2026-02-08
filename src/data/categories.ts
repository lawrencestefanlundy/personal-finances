import { ExpenseCategory, AssetCategory } from '@/types/finance';

export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
}

export const expenseCategories: Record<ExpenseCategory, CategoryMeta> = {
  debt: { label: 'Debt', color: '#ef4444', bgColor: '#fef2f2' },
  school: { label: 'School Fees', color: '#8b5cf6', bgColor: '#f5f3ff' },
  holiday: { label: 'Holidays', color: '#f59e0b', bgColor: '#fffbeb' },
  groceries: { label: 'Groceries', color: '#10b981', bgColor: '#ecfdf5' },
  bills: { label: 'Bills', color: '#3b82f6', bgColor: '#eff6ff' },
  health: { label: 'Health', color: '#ec4899', bgColor: '#fdf2f8' },
  car: { label: 'Car', color: '#6366f1', bgColor: '#eef2ff' },
  insurance: { label: 'Insurance', color: '#14b8a6', bgColor: '#f0fdfa' },
  subscriptions: { label: 'Subscriptions', color: '#a855f7', bgColor: '#faf5ff' },
  extracurricular: { label: 'Extracurricular', color: '#f97316', bgColor: '#fff7ed' },
  house: { label: 'House', color: '#84cc16', bgColor: '#f7fee7' },
  tax: { label: 'Tax', color: '#dc2626', bgColor: '#fef2f2' },
  investment: { label: 'Investments', color: '#0ea5e9', bgColor: '#f0f9ff' },
  other: { label: 'Other', color: '#6b7280', bgColor: '#f9fafb' },
};

export const assetCategories: Record<AssetCategory, CategoryMeta> = {
  savings: { label: 'Savings', color: '#10b981', bgColor: '#ecfdf5' },
  isa: { label: 'ISA', color: '#3b82f6', bgColor: '#eff6ff' },
  crypto: { label: 'Crypto', color: '#f59e0b', bgColor: '#fffbeb' },
  fund: { label: 'Fund', color: '#8b5cf6', bgColor: '#f5f3ff' },
  angel: { label: 'Angel', color: '#ec4899', bgColor: '#fdf2f8' },
  pension: { label: 'Pension', color: '#14b8a6', bgColor: '#f0fdfa' },
  property: { label: 'Property', color: '#6366f1', bgColor: '#eef2ff' },
  vehicle: { label: 'Vehicle', color: '#6b7280', bgColor: '#f9fafb' },
  children_isa: { label: "Children's ISA", color: '#f97316', bgColor: '#fff7ed' },
};
