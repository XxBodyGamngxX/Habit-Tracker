import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { FinanceData, Expense, SavingsGoal } from '@/types';

interface CycleDetails {
  cycleEndDate: Date;
  remainingDays: number;
  formattedRange: string;
}

interface FinanceContextType {
  financeData: FinanceData;
  cycleDetails: CycleDetails;
  setupFinance: (income: number, startingDate: string, currency: string, visaAlloc?: number, walletAlloc?: number) => void;
  logExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addFunds: (amount: number, account: 'visa' | 'wallet') => void;
  transferToSavings: (amount: number, sourceAccount: 'visa' | 'wallet') => boolean;
  setActiveGoal: (goal: SavingsGoal) => void;
  deleteActiveGoal: () => void;
  toggleCategoryEssential: (category: string) => void;
  addCustomCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  claimDailyBonusXP: () => boolean;
  isTodayBonusClaimed: boolean;
  getAIReport: () => Promise<string>;
  totalSpentThisCycle: number;
  remainingBalance: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    return loadLocalData<FinanceData>('financeData', {
      monthYear: '',
      startingDate: '',
      monthlyIncome: 0,
      dailyBudget: 0,
      expenses: [],
      xpBonusClaimedDates: {},
      categories: ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗'],
      currency: 'EGP',
      savingsBalance: 0,
      savingsGoals: [],
      activeGoal: null,
      essentialCategories: {
        'Diet & Groceries 🍏': true,
        'Transportation 🚗': true,
      },
      itemPreferences: {},
      lastClaimedBonusDate: '',
      visaBalance: 0,
      walletBalance: 0,
      visaIncluded: true,
      visaAllocation: 0,
      walletAllocation: 0,
    });
  });

  useEffect(() => {
    if (userDoc?.financeData) {
      setFinanceData(userDoc.financeData);
      localStorage.setItem('financeData', JSON.stringify(userDoc.financeData));
    }
  }, [userDoc]);

  const saveFinance = (data: FinanceData) => {
    setFinanceData(data);
    saveLocalData('financeData', data, user?.uid);
  };

  const getCycleDetails = (data: FinanceData = financeData): CycleDetails => {
    if (!data.startingDate) {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        cycleEndDate: lastDay,
        remainingDays: Math.max(1, lastDay.getDate() - now.getDate() + 1),
        formattedRange: now.toLocaleString('default', { month: 'long' }),
      };
    }

    const startDate = new Date(data.startingDate);
    startDate.setHours(0, 0, 0, 0);

    const cycleEndDate = new Date(startDate);
    cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTime = cycleEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = diffDays > 0 ? diffDays : 1;

    const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const formattedRange = `${startDate.toLocaleDateString('default', formatOpts)} - ${cycleEndDate.toLocaleDateString('default', formatOpts)}`;

    return { cycleEndDate, remainingDays, formattedRange };
  };

  const cycleDetails = getCycleDetails();

  const totalSpentThisCycle = (financeData.expenses || [])
    .filter((e) => e.type !== 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const remainingBalance = Math.max(0, financeData.monthlyIncome - totalSpentThisCycle);

  const setupFinance = (
    income: number,
    startingDate: string,
    currency: string = 'EGP',
    visaAlloc?: number,
    walletAlloc?: number
  ) => {
    const remainingDays = getCycleDetails({ ...financeData, startingDate }).remainingDays;
    const dailyBudget = parseFloat((income / Math.max(1, remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: income,
      startingDate,
      currency: currency || 'EGP',
      dailyBudget,
      visaBalance: visaAlloc !== undefined ? visaAlloc : income,
      walletBalance: walletAlloc !== undefined ? walletAlloc : 0,
      visaAllocation: visaAlloc !== undefined ? visaAlloc : income,
      walletAllocation: walletAlloc !== undefined ? walletAlloc : 0,
      expenses: [],
    };
    saveFinance(updated);
  };

  const logExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };

    const newExpenses = [newExpense, ...(financeData.expenses || [])];
    const newTotalSpent = newExpenses
      .filter((e) => e.type !== 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const newRemaining = Math.max(0, financeData.monthlyIncome - newTotalSpent);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    // Deduct from appropriate account
    let nextVisa = financeData.visaBalance || 0;
    let nextWallet = financeData.walletBalance || 0;

    if (expenseData.paymentMethod === 'visa') {
      nextVisa = Math.max(0, nextVisa - expenseData.amount);
    } else {
      nextWallet = Math.max(0, nextWallet - expenseData.amount);
    }

    const updated: FinanceData = {
      ...financeData,
      expenses: newExpenses,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };

    saveFinance(updated);
  };

  const deleteExpense = (id: string) => {
    const expToDelete = financeData.expenses.find((e) => e.id === id);
    if (!expToDelete) return;

    const newExpenses = financeData.expenses.filter((e) => e.id !== id);
    const newTotalSpent = newExpenses
      .filter((e) => e.type !== 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const newRemaining = Math.max(0, financeData.monthlyIncome - newTotalSpent);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    // Refund to appropriate account
    let nextVisa = financeData.visaBalance || 0;
    let nextWallet = financeData.walletBalance || 0;
    if (expToDelete.paymentMethod === 'visa') {
      nextVisa += expToDelete.amount;
    } else {
      nextWallet += expToDelete.amount;
    }

    const updated: FinanceData = {
      ...financeData,
      expenses: newExpenses,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };
    saveFinance(updated);
  };

  const addFunds = (amount: number, account: 'visa' | 'wallet') => {
    const nextIncome = (financeData.monthlyIncome || 0) + amount;
    const nextVisa = account === 'visa' ? (financeData.visaBalance || 0) + amount : financeData.visaBalance;
    const nextWallet = account === 'wallet' ? (financeData.walletBalance || 0) + amount : financeData.walletBalance;

    const newRemaining = Math.max(0, nextIncome - totalSpentThisCycle);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: nextIncome,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };
    saveFinance(updated);
  };

  const transferToSavings = (amount: number, sourceAccount: 'visa' | 'wallet'): boolean => {
    const currentAccBalance = sourceAccount === 'visa' ? (financeData.visaBalance || 0) : (financeData.walletBalance || 0);
    if (currentAccBalance < amount) return false;

    const nextVisa = sourceAccount === 'visa' ? (financeData.visaBalance || 0) - amount : financeData.visaBalance;
    const nextWallet = sourceAccount === 'wallet' ? (financeData.walletBalance || 0) - amount : financeData.walletBalance;
    const nextSavings = (financeData.savingsBalance || 0) + amount;

    // Deducting from spendable income
    const nextIncome = Math.max(0, (financeData.monthlyIncome || 0) - amount);
    const newRemaining = Math.max(0, nextIncome - totalSpentThisCycle);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: nextIncome,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
      savingsBalance: nextSavings,
    };
    saveFinance(updated);
    return true;
  };

  const setActiveGoal = (goal: SavingsGoal) => {
    const updated: FinanceData = {
      ...financeData,
      activeGoal: goal,
    };
    saveFinance(updated);
  };

  const deleteActiveGoal = () => {
    const updated: FinanceData = {
      ...financeData,
      activeGoal: null,
    };
    saveFinance(updated);
  };

  const toggleCategoryEssential = (cat: string) => {
    const updatedMap = {
      ...(financeData.essentialCategories || {}),
      [cat]: !financeData.essentialCategories?.[cat],
    };
    const updated: FinanceData = {
      ...financeData,
      essentialCategories: updatedMap,
    };
    saveFinance(updated);
  };

  const addCustomCategory = (cat: string) => {
    if (!cat.trim() || financeData.categories.includes(cat.trim())) return;
    const updated: FinanceData = {
      ...financeData,
      categories: [...financeData.categories, cat.trim()],
    };
    saveFinance(updated);
  };

  const removeCategory = (cat: string) => {
    const updated: FinanceData = {
      ...financeData,
      categories: financeData.categories.filter((c) => c !== cat),
    };
    saveFinance(updated);
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const isTodayBonusClaimed = Boolean(financeData.xpBonusClaimedDates?.[todayStr]);

  const claimDailyBonusXP = (): boolean => {
    if (isTodayBonusClaimed) return false;

    // Check if user spent less than daily budget today
    const todayExpenses = (financeData.expenses || []).filter(
      (e) => e.date === todayStr && e.type !== 'income'
    );
    const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (spentToday > financeData.dailyBudget) {
      return false;
    }

    const updatedClaimed = {
      ...(financeData.xpBonusClaimedDates || {}),
      [todayStr]: true,
    };

    const updated: FinanceData = {
      ...financeData,
      xpBonusClaimedDates: updatedClaimed,
      lastClaimedBonusDate: todayStr,
    };
    saveFinance(updated);

    gainXP(50, 'Daily Budget Bonus Claimed');
    return true;
  };

  const getAIReport = async (): Promise<string> => {
    const apiKey = 'AQ.Ab8RN6LeB6-5yv8xPq3BB49fDyqRQjqhEnP5gYOrqe-QBIbQLg';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const recentExpenses = (financeData.expenses || []).slice(0, 20);
    const expensesText = JSON.stringify(recentExpenses);
    const prompt = `أنا بستخدم تطبيق Mornigami لتتبع مصاريفي. دي قائمة مشترياتي الأخيرة: ${expensesText}. 
بصفتك مستشار مالي محترف، حلل الأرقام والتصنيفات دي، واكتب تقرير ملخص من 3 سطور، واديني نصيحة عملية لتحسين ميزانيتي وتقليل النفقات باللغة العربية.`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'لا توجد نصيحة حالياً.';
    } catch (error) {
      console.error('AI Error:', error);
      return 'خطأ في الاتصال بالذكاء الاصطناعي.';
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        financeData,
        cycleDetails,
        setupFinance,
        logExpense,
        deleteExpense,
        addFunds,
        transferToSavings,
        setActiveGoal,
        deleteActiveGoal,
        toggleCategoryEssential,
        addCustomCategory,
        removeCategory,
        claimDailyBonusXP,
        isTodayBonusClaimed,
        getAIReport,
        totalSpentThisCycle,
        remainingBalance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
