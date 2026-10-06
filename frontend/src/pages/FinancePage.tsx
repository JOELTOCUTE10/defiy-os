import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Target,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { financeApi } from '../api/endpoints';
import type { FinanceEntry, SavingsGoal, FinanceSummary } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'];

export const FinancePage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  // Modals
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [contributeTarget, setContributeTarget] = useState<SavingsGoal | null>(null);

  // Forms
  const [entryForm, setFormState] = useState({
    kind: 'expense' as 'income' | 'expense' | 'savings',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    notes: '',
  });

  const [contributeAmount, setContributeAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, entriesRes, goalsRes] = await Promise.all([
        financeApi.getSummary().catch(() => null),
        financeApi.listEntries().catch(() => []),
        financeApi.listSavingsGoals().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      setEntries(entriesRes || []);
      setSavingsGoals(goalsRes || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load financial data';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(entryForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await financeApi.createEntry({
        kind: entryForm.kind,
        amount: numAmount,
        category: entryForm.category,
        description: entryForm.description || undefined,
        date: entryForm.date,
      });
      showToast('Entry logged successfully!', 'success');
      setIsAddEntryOpen(false);
      setFormState({
        kind: 'expense',
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add entry';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalForm.target_amount);
    if (!goalForm.name.trim() || isNaN(target) || target <= 0) {
      showToast('Please enter a valid goal name and target amount', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await financeApi.createSavingsGoal({
        name: goalForm.name,
        target_amount: target,
        current_amount: 0,
        deadline: goalForm.deadline || undefined,
        status: 'active',
        notes: goalForm.notes || undefined,
      });
      showToast('Savings goal created!', 'success');
      setIsAddGoalOpen(false);
      setGoalForm({ name: '', target_amount: '', deadline: '', notes: '' });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create goal';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeTarget) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid contribution amount', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await financeApi.contributeSavingsGoal(contributeTarget.id, amount);
      showToast(`Contributed $${amount.toFixed(2)} to ${contributeTarget.name}!`, 'success');
      setContributeTarget(null);
      setContributeAmount('');
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to contribute to savings goal';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalIncome = summary?.total_income ?? 0;
  const totalExpenses = summary?.total_expenses ?? 0;
  const totalSavings = summary?.total_savings ?? 0;
  const netCashFlow = totalIncome - totalExpenses;

  const chartData = summary?.categories ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Wealth"
        subtitle="Track cash flow, monitor category spending, and achieve savings goals."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddGoalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>New Goal</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsAddEntryOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </Button>
          </div>
        }
      />

      {/* Educational Disclaimer Banner */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          Educational guidance only — not a licensed financial advisor.
        </p>
      </Card>

      {/* Finance Summary Tiles */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            title="Total Income"
            value={`$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle="Income entries"
            icon={TrendingUp}
            iconColor="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
          />
          <StatTile
            title="Total Expenses"
            value={`$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle="Outflow logged"
            icon={TrendingDown}
            iconColor="text-rose-500 bg-rose-50 dark:bg-rose-500/10"
          />
          <StatTile
            title="Total Savings"
            value={`$${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle="Saved total"
            icon={PiggyBank}
            iconColor="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
          />
          <StatTile
            title="Net Cash Flow"
            value={`$${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle="Income minus expenses"
            icon={DollarSign}
            iconColor={
              netCashFlow >= 0
                ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
            }
          />
        </div>
      )}

      {/* Spending by Category Bar Chart */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-brand-500" />
          <span>Spending by Category</span>
        </h3>

        {loading ? (
          <Skeleton className="h-56 rounded-2xl" />
        ) : chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400">
            No expense category data recorded yet. Log your expenses to see visual insights.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: number) => [`$${val.toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Savings Goals Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-500" />
            <span>Savings Goals</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddGoalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : savingsGoals.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No savings goals created"
            description="Set milestone targets for emergency funds, travel, or major purchases."
            actionLabel="Create Goal"
            onAction={() => setIsAddGoalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const current = goal.current_amount || 0;
              const target = goal.target_amount || 1;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <Card key={goal.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </h4>
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono">
                        ${current.toLocaleString()} / ${target.toLocaleString()}
                      </span>
                    </div>

                    <ProgressBar value={pct} color="brand" className="my-2" />

                    {goal.deadline && (
                      <p className="text-xs text-slate-400 mt-1">
                        Target date: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-darkborder/60">
                    <span className="text-xs font-medium text-slate-500">{pct}% completed</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setContributeTarget(goal)}
                    >
                      Contribute
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Recent Transactions</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddEntryOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No transactions logged"
            description="Start logging income, expenses, or savings contributions."
            actionLabel="Add Entry"
            onAction={() => setIsAddEntryOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isIncome = entry.kind === 'income';
              const isSavings = entry.kind === 'savings';

              return (
                <Card key={entry.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isSavings
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : isSavings ? (
                        <PiggyBank className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {entry.category}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {entry.kind}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-sm font-mono ${
                        isIncome
                          ? 'text-emerald-500'
                          : isSavings
                          ? 'text-indigo-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : isSavings ? '' : '-'}${entry.amount.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD ENTRY */}
      <Modal isOpen={isAddEntryOpen} onClose={() => setIsAddEntryOpen(false)} title="Log Financial Entry">
        <form onSubmit={handleAddEntry} className="space-y-4">
          <Select
            label="Type / Kind"
            value={entryForm.kind}
            onChange={(e) =>
              setFormState({
                ...entryForm,
                kind: e.target.value as 'income' | 'expense' | 'savings',
              })
            }
            options={[
              { value: 'expense', label: 'Expense (- Outflow)' },
              { value: 'income', label: 'Income (+ Inflow)' },
              { value: 'savings', label: 'Savings Transfer' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={entryForm.amount}
              onChange={(e) => setFormState({ ...entryForm, amount: e.target.value })}
              required
            />

            <Select
              label="Category"
              value={entryForm.category}
              onChange={(e) => setFormState({ ...entryForm, category: e.target.value })}
              options={[
                { value: 'Food', label: 'Food & Dining' },
                { value: 'Housing', label: 'Housing & Rent' },
                { value: 'Utilities', label: 'Utilities & Bills' },
                { value: 'Transport', label: 'Transportation' },
                { value: 'Salary', label: 'Salary / Income' },
                { value: 'Entertainment', label: 'Entertainment & Fun' },
                { value: 'Shopping', label: 'Shopping & Gear' },
                { value: 'Education', label: 'Education & Tuition' },
                { value: 'Health', label: 'Health & Medical' },
                { value: 'Savings', label: 'Savings' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={entryForm.date}
            onChange={(e) => setFormState({ ...entryForm, date: e.target.value })}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="e.g. Grocery run or Freelance client payment"
            value={entryForm.description}
            onChange={(e) => setFormState({ ...entryForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEntryOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD SAVINGS GOAL */}
      <Modal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} title="Create Savings Goal">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund or New Laptop"
            value={goalForm.name}
            onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Amount ($)"
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={goalForm.target_amount}
              onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
              required
            />

            <Input
              label="Deadline (Optional)"
              type="date"
              value={goalForm.deadline}
              onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes / Strategy"
            placeholder="e.g. Transfer $100 per paycheck"
            value={goalForm.notes}
            onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddGoalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONTRIBUTE TO GOAL */}
      <Modal
        isOpen={contributeTarget !== null}
        onClose={() => setContributeTarget(null)}
        title={`Contribute to ${contributeTarget?.name || 'Goal'}`}
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <Input
            label="Contribution Amount ($)"
            type="number"
            step="0.01"
            placeholder="50.00"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContributeTarget(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Contribute
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
