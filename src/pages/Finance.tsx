import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import {
  Plus,
  Trash2,
  Sparkles,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Target,
  Calendar,
  Layers,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const Finance: React.FC = () => {
  const {
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
  } = useFinance();

  // Modals
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [savingsModalOpen, setSavingsModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  // Setup Form
  const [incomeInput, setIncomeInput] = useState(financeData.monthlyIncome || 0);
  const [startingDateInput, setStartingDateInput] = useState(
    financeData.startingDate || new Date().toISOString().substring(0, 10)
  );
  const [currencyInput, setCurrencyInput] = useState(financeData.currency || 'EGP');
  const [visaAllocInput, setVisaAllocInput] = useState(financeData.visaAllocation || 0);
  const [walletAllocInput, setWalletAllocInput] = useState(financeData.walletAllocation || 0);

  // Expense Form
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expCategory, setExpCategory] = useState(financeData.categories[0] || 'Coffee ☕');
  const [expDate, setExpDate] = useState(new Date().toISOString().substring(0, 10));
  const [expDesc, setExpDesc] = useState('');
  const [expMethod, setExpMethod] = useState<'visa' | 'wallet'>('visa');
  const [expEssential, setExpEssential] = useState(false);

  // Add Funds Form
  const [fundAmount, setFundAmount] = useState<number | ''>('');
  const [fundAccount, setFundAccount] = useState<'visa' | 'wallet'>('visa');

  // Savings Transfer Form
  const [savingsAmount, setSavingsAmount] = useState<number | ''>('');
  const [savingsAccount, setSavingsAccount] = useState<'visa' | 'wallet'>('visa');

  // Goal Form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState<number | ''>('');
  const [goalDuration, setGoalDuration] = useState<number | ''>(6);

  // Category Form
  const [newCatName, setNewCatName] = useState('');

  // AI Advisor
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const currency = financeData.currency || 'EGP';

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setupFinance(
      Number(incomeInput),
      startingDateInput,
      currencyInput,
      Number(visaAllocInput),
      Number(walletAllocInput)
    );
    setSetupModalOpen(false);
    toast.success('Finance cycle configured successfully!');
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim() || !expAmount || Number(expAmount) <= 0) return;

    logExpense({
      name: expName.trim(),
      amount: Number(expAmount),
      category: expCategory,
      date: expDate,
      description: expDesc.trim(),
      paymentMethod: expMethod,
      isEssential: expEssential,
    });

    setExpName('');
    setExpAmount('');
    setExpDesc('');
    setExpenseModalOpen(false);
    toast.success('Expense recorded!');
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || Number(fundAmount) <= 0) return;
    addFunds(Number(fundAmount), fundAccount);
    setFundAmount('');
    setAddFundsModalOpen(false);
    toast.success('Funds added to your account!');
  };

  const handleSavingsTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingsAmount || Number(savingsAmount) <= 0) return;
    const ok = transferToSavings(Number(savingsAmount), savingsAccount);
    if (!ok) {
      toast.error('Insufficient funds in the selected account.');
      return;
    }
    setSavingsAmount('');
    setSavingsModalOpen(false);
    toast.success('Transferred to Savings Vault!');
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget || !goalDuration) return;
    setActiveGoal({
      name: goalName.trim(),
      target: Number(goalTarget),
      duration: Number(goalDuration),
      startDate: new Date().toISOString().substring(0, 10),
    });
    setGoalModalOpen(false);
    toast.success('Active savings goal configured!');
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCustomCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleClaimBonus = () => {
    const success = claimDailyBonusXP();
    if (success) {
      toast.success('Claimed +50 XP bonus for disciplined spending!');
    } else {
      toast.error('You exceeded today’s budget or already claimed today’s bonus.');
    }
  };

  const handleFetchAIReport = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const text = await getAIReport();
      setAiReport(text);
    } catch {
      setAiReport('Failed to generate AI report.');
    } finally {
      setAiLoading(false);
    }
  };

  // Savings Goal calculations
  const goal = financeData.activeGoal;
  const goalProgress = goal && goal.target > 0
    ? Math.min(100, Math.round(((financeData.savingsBalance || 0) / goal.target) * 100))
    : 0;
  const goalMonthlyReq = goal && goal.duration > 0 ? (goal.target / goal.duration).toFixed(2) : '0';
  const goalWeeklyReq = goal && goal.duration > 0 ? (goal.target / (goal.duration * 4.33)).toFixed(2) : '0';
  const goalDailyReq = goal && goal.duration > 0 ? (goal.target / (goal.duration * 30.4)).toFixed(2) : '0';

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">
            Financial Intelligence
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Dynamic salary cycle tracking, savings vault calculator, and Gemini AI spending advisory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSetupModalOpen(true)}
            className="h-10 text-xs font-bold gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cycle Settings</span>
          </Button>

          <Button
            onClick={() => setExpenseModalOpen(true)}
            className="h-10 text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </Button>
        </div>
      </div>

      {/* Cycle Indicator & Daily XP Bonus Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 text-xs font-bold text-text-secondary">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span>Active Cycle: {cycleDetails.formattedRange}</span>
          <span className="text-primary">• {cycleDetails.remainingDays} days remaining</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleClaimBonus}
          disabled={isTodayBonusClaimed}
          className="h-8 text-xs font-bold gap-1.5 border-warning/40 text-warning hover:bg-warning/10"
        >
          <Gift className="w-3.5 h-3.5" />
          <span>{isTodayBonusClaimed ? 'Today Bonus Claimed (+50 XP)' : 'Claim Daily Budget XP (+50 XP)'}</span>
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Remaining Spendable Balance */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-bold">
            <span>Spendable Balance</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-text-primary">
              {currency} {remainingBalance.toLocaleString()}
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Income: {currency} {(financeData.monthlyIncome || 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={financeData.monthlyIncome > 0 ? (totalSpentThisCycle / financeData.monthlyIncome) * 100 : 0}
              className="h-1.5"
            />
          </div>
        </Card>

        {/* Daily Spendable Limit */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-bold">
            <span>Daily Budget Allowance</span>
            <Target className="w-4 h-4 text-secondary" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-secondary">
              {currency} {financeData.dailyBudget.toFixed(2)}
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Over {cycleDetails.remainingDays} remaining days
            </div>
          </div>
          <div className="text-[10px] text-text-tertiary mt-2">
            Stay below this daily to claim XP!
          </div>
        </Card>

        {/* Dual Accounts: Visa & Wallet */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-bold">
            <span>Accounts Balance</span>
            <button
              onClick={() => setAddFundsModalOpen(true)}
              className="text-[11px] text-primary hover:underline font-bold"
            >
              + Add Funds
            </button>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary font-bold">
                <CreditCard className="w-3.5 h-3.5 text-secondary" /> Visa
              </span>
              <span className="font-extrabold text-text-primary">
                {currency} {(financeData.visaBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary font-bold">
                <Wallet className="w-3.5 h-3.5 text-warning" /> Cash Wallet
              </span>
              <span className="font-extrabold text-text-primary">
                {currency} {(financeData.walletBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Savings Vault */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-bold">
            <span>Savings Vault</span>
            <button
              onClick={() => setSavingsModalOpen(true)}
              className="text-[11px] text-primary hover:underline font-bold"
            >
              Transfer In
            </button>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-success">
              {currency} {(financeData.savingsBalance || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Secure locked reserves
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary mt-2">
            <PiggyBank className="w-3.5 h-3.5 text-success" />
            <span>Vault protected</span>
          </div>
        </Card>
      </div>

      {/* Active Savings Goal Calculator Card */}
      <Card className="p-6 border-2 border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-text-primary">
                {goal ? goal.name : 'Active Savings Goal'}
              </h3>
              <p className="text-xs text-text-secondary">
                {goal
                  ? `Target: ${currency} ${goal.target.toLocaleString()} over ${goal.duration} months`
                  : 'Set a savings objective to calculate exact daily/weekly/monthly savings pace.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {goal ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGoalName(goal.name);
                    setGoalTarget(goal.target);
                    setGoalDuration(goal.duration);
                    setGoalModalOpen(true);
                  }}
                  className="h-8 text-xs font-bold"
                >
                  Edit Goal
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={deleteActiveGoal}
                  className="h-8 text-xs text-danger hover:bg-danger-bg font-bold"
                >
                  Clear Goal
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setGoalName('');
                  setGoalTarget('');
                  setGoalDuration(6);
                  setGoalModalOpen(true);
                }}
                className="h-8 text-xs font-bold"
              >
                Set Savings Target
              </Button>
            )}
          </div>
        </div>

        {goal && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>
                Vault Progress: {currency} {(financeData.savingsBalance || 0).toLocaleString()} / {currency} {goal.target.toLocaleString()}
              </span>
              <span>{goalProgress}%</span>
            </div>
            <Progress value={goalProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase">Daily Savings Pace</div>
                <div className="text-sm font-extrabold text-text-primary mt-0.5">{currency} {goalDailyReq}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase">Weekly Savings Pace</div>
                <div className="text-sm font-extrabold text-text-primary mt-0.5">{currency} {goalWeeklyReq}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase">Monthly Savings Pace</div>
                <div className="text-sm font-extrabold text-text-primary mt-0.5">{currency} {goalMonthlyReq}</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Google Gemini AI Spending Advisor Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text-primary">
                Gemini 1.5 Flash AI Financial Advisor
              </h3>
              <p className="text-xs text-text-secondary">
                Generate an intelligent Arabic spending analysis based on your recent purchase ledger.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleFetchAIReport}
            disabled={aiLoading}
            className="h-9 text-xs font-bold gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiLoading ? 'Analyzing Ledger...' : 'Generate Financial Report'}</span>
          </Button>
        </div>

        {aiReport && (
          <div className="mt-4 p-4 rounded-2xl bg-surface border border-border text-xs leading-relaxed text-text-primary whitespace-pre-line font-medium dir-rtl text-right">
            {aiReport}
          </div>
        )}
      </Card>

      {/* Expenses Table Header & Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-text-primary">
            Purchase & Expense Ledger
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoriesModalOpen(true)}
            className="h-8 text-xs font-bold gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Customizer Categories</span>
          </Button>
        </div>

        {financeData.expenses && financeData.expenses.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background/50 font-bold uppercase text-[10px] text-text-secondary">
                  <th className="p-3 pl-4">Item</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {financeData.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-background/40 transition-colors">
                    <td className="p-3 pl-4 font-bold text-text-primary">
                      {exp.name}
                      {exp.isEssential && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-success-bg text-success font-black">
                          Essential
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-text-secondary truncate max-w-[150px]">
                      {exp.description || '—'}
                    </td>
                    <td className="p-3 font-semibold text-text-primary">
                      {exp.category}
                    </td>
                    <td className="p-3">
                      <span className="capitalize font-bold text-text-secondary">
                        {exp.paymentMethod || 'visa'}
                      </span>
                    </td>
                    <td className="p-3 text-text-secondary whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="p-3 text-right font-black text-danger whitespace-nowrap">
                      - {currency} {exp.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center pr-4">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-text-tertiary hover:text-danger transition-colors p-1"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <div className="text-4xl mb-3">💸</div>
            <h4 className="font-display text-base font-bold text-text-primary">
              No expenses recorded in this cycle
            </h4>
            <p className="text-xs text-text-secondary mt-1 mb-4">
              Log daily purchases to track your spending limit and earn bonus XP.
            </p>
            <Button size="sm" onClick={() => setExpenseModalOpen(true)} className="font-bold text-xs">
              Log First Expense
            </Button>
          </Card>
        )}
      </div>

      {/* Cycle Setup Modal */}
      <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Cycle & Income Setup</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Configure your dynamic salary cycle dates, total income, and dual accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetupSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Total Spendable Income</label>
              <Input
                type="number"
                step="0.01"
                required
                value={incomeInput}
                onChange={(e) => setIncomeInput(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Cycle Starting Date</label>
                <Input
                  type="date"
                  required
                  value={startingDateInput}
                  onChange={(e) => setStartingDateInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Currency</label>
                <Input
                  type="text"
                  required
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Initial Visa Balance</label>
                <Input
                  type="number"
                  step="0.01"
                  value={visaAllocInput}
                  onChange={(e) => setVisaAllocInput(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Initial Wallet Balance</label>
                <Input
                  type="number"
                  step="0.01"
                  value={walletAllocInput}
                  onChange={(e) => setWalletAllocInput(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Save Cycle Configuration
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Expense Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Record Expense</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Log purchase item, description, payment account, and date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Item / Name</label>
              <Input
                required
                placeholder="e.g., Morning Espresso, Grocery run"
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Amount ({currency})</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Date</label>
                <Input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {financeData.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Payment Method</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as 'visa' | 'wallet')}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="visa">Visa Account</option>
                  <option value="wallet">Cash Wallet</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Details / Note (Optional)</label>
              <Input
                placeholder="e.g. 2 bags of coffee beans"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="expEssentialToggle"
                checked={expEssential}
                onChange={(e) => setExpEssential(e.target.checked)}
                className="w-4 h-4 rounded text-primary"
              />
              <label htmlFor="expEssentialToggle" className="text-xs font-bold text-text-primary cursor-pointer">
                Classify as Essential Need (vs Non-essential want)
              </label>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Add Expense to Ledger
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Modal */}
      <Dialog open={addFundsModalOpen} onOpenChange={setAddFundsModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Add Mid-Month Funds</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Inject additional balance into your Visa or Cash Wallet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFundsSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Amount ({currency})</label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Destination Account</label>
              <select
                value={fundAccount}
                onChange={(e) => setFundAccount(e.target.value as 'visa' | 'wallet')}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="visa">Visa Account</option>
                <option value="wallet">Cash Wallet</option>
              </select>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Inject Funds
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Savings Transfer Modal */}
      <Dialog open={savingsModalOpen} onOpenChange={setSavingsModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Transfer to Savings Vault</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Transfers funds from your spendable balance directly into the secure savings vault.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavingsTransferSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Transfer Amount ({currency})</label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Source Account</label>
              <select
                value={savingsAccount}
                onChange={(e) => setSavingsAccount(e.target.value as 'visa' | 'wallet')}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="visa">Visa Account</option>
                <option value="wallet">Cash Wallet</option>
              </select>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Transfer to Vault
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Configure Savings Goal</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Set target and duration to calculate daily, weekly, and monthly paces.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGoalSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Goal Object / Item</label>
              <Input
                required
                placeholder="e.g., 2TB SSD, New Laptop, Trip"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Target ({currency})</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Duration (Months)</label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="6"
                  value={goalDuration}
                  onChange={(e) => setGoalDuration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Save Savings Target
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories Customizer Modal */}
      <Dialog open={categoriesModalOpen} onOpenChange={setCategoriesModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Categories Customizer</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Toggle essential flags or add custom tags to customize spending categorization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
              <Input
                placeholder="New Category Tag (e.g. Books 📚)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <Button type="submit" size="sm" className="h-10 font-bold shrink-0">Add</Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {financeData.categories.map((cat) => {
                const isEssential = Boolean(financeData.essentialCategories?.[cat]);
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background"
                  >
                    <span className="text-xs font-bold text-text-primary">{cat}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategoryEssential(cat)}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-black border transition-all',
                          isEssential
                            ? 'bg-success-bg text-success border-success/30'
                            : 'bg-surface text-text-tertiary border-border hover:text-text-primary'
                        )}
                      >
                        {isEssential ? 'Essential Need' : 'Discretionary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="text-text-tertiary hover:text-danger p-1"
                        title="Remove category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
