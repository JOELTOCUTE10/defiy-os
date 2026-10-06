import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Chip } from '../components/ui/Chip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useToast } from '../hooks/useToast';
import { nutritionApi } from '../api/endpoints';
import type { Meal, MealItem, DailyNutrition, WeeklyNutritionStats, NutritionPatterns } from '../api/types';
import {
  Utensils,
  Plus,
  Droplets,
  Flame,
  Sparkles,
  Trash2,
  Info,
  Apple,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface MealItemInput {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export const TrackNutrition: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyNutrition | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyNutritionStats | null>(null);
  const [patterns, setPatterns] = useState<NutritionPatterns | null>(null);
  const [hydrationTotal, setHydrationTotal] = useState<number>(0);
  const [addingHydration, setAddingHydration] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingMeal, setSubmittingMeal] = useState(false);
  const [mealTitle, setMealTitle] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealNotes, setMealNotes] = useState('');
  const [items, setItems] = useState<MealItemInput[]>([
    { name: '', quantity: 1, unit: 'serving', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dailyRes, weeklyRes, patternsRes] = await Promise.all([
        nutritionApi.getDaily(),
        nutritionApi.getWeekly().catch(() => ({ days: [] })),
        nutritionApi.getPatterns().catch(() => ({ patterns: [], caution_note: '' })),
      ]);
      setDailyData(dailyRes);
      setWeeklyData(weeklyRes);
      setPatterns(patternsRes);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load nutrition data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddHydration = async (ml: number) => {
    setAddingHydration(true);
    try {
      await nutritionApi.addHydration(ml);
      setHydrationTotal((prev) => prev + ml);
      showToast(`Added ${ml}ml water!`, 'success');
    } catch (err: any) {
      showToast('Failed to log water', 'error');
    } finally {
      setAddingHydration(false);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { name: '', quantity: 1, unit: 'serving', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof MealItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculatedTotals = items.reduce(
    (acc, curr) => ({
      calories: acc.calories + (Number(curr.calories) || 0),
      protein: acc.protein + (Number(curr.protein_g) || 0),
      carbs: acc.carbs + (Number(curr.carbs_g) || 0),
      fat: acc.fat + (Number(curr.fat_g) || 0),
      fiber: acc.fiber + (Number(curr.fiber_g) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTitle.trim()) {
      showToast('Please enter a meal title', 'error');
      return;
    }

    const validItems = items.filter((it) => it.name.trim().length > 0);
    const dateStr = new Date().toISOString().split('T')[0];

    setSubmittingMeal(true);
    try {
      await nutritionApi.createMeal({
        title: mealTitle.trim(),
        meal_type: mealType,
        date: dateStr,
        source: 'manual',
        confirmed: true,
        notes: mealNotes.trim() || undefined,
        items: validItems.map((it) => ({
          name: it.name,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'serving',
          calories: Number(it.calories) || 0,
          protein_g: Number(it.protein_g) || 0,
          carbs_g: Number(it.carbs_g) || 0,
          fat_g: Number(it.fat_g) || 0,
          fiber_g: Number(it.fiber_g) || 0,
          is_estimate: false,
        })),
      });

      showToast('Meal logged successfully!', 'success');
      setIsModalOpen(false);
      // Reset form
      setMealTitle('');
      setMealType('breakfast');
      setMealNotes('');
      setItems([{ name: '', quantity: 1, unit: 'serving', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }]);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to log meal', 'error');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await nutritionApi.deleteMeal(mealId);
      showToast('Meal deleted', 'info');
      await loadData();
    } catch (err: any) {
      showToast('Failed to delete meal', 'error');
    }
  };

  const calorieTarget = 2200;
  const proteinTarget = 150;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition Tracker"
        subtitle="Log daily meals, monitor macros, log hydration, and discover dietary insights."
        backUrl="/track"
        icon={Utensils}
        action={
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Log Meal
          </Button>
        }
      />

      {/* Hydration Bar & Quick Add */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Daily Hydration Tracker</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quickly record water intake throughout the day ({hydrationTotal} ml logged)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            loading={addingHydration}
            onClick={() => handleAddHydration(250)}
          >
            +250 ml
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={addingHydration}
            onClick={() => handleAddHydration(500)}
          >
            +500 ml
          </Button>
        </div>
      </Card>

      {/* Daily Macro Summary */}
      {loading ? (
        <Skeleton variant="card" count={1} className="h-36" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Calories Today</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {dailyData?.calories || 0} <span className="text-xs font-normal text-slate-500">/ {calorieTarget} kcal</span>
            </div>
            <ProgressBar value={dailyData?.calories || 0} max={calorieTarget} color="amber" showPercentage={false} />
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Protein</span>
              <Apple className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {dailyData?.protein_g || 0}g <span className="text-xs font-normal text-slate-500">/ {proteinTarget}g</span>
            </div>
            <ProgressBar value={dailyData?.protein_g || 0} max={proteinTarget} color="emerald" showPercentage={false} />
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Carbohydrates</span>
              <Utensils className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {dailyData?.carbs_g || 0}g
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Energy & endurance</span>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Fats & Fiber</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              F: {dailyData?.fat_g || 0}g | Fib: {dailyData?.fiber_g || 0}g
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Micros & Digestion</span>
          </Card>
        </div>
      )}

      {/* Main Content Grid: Meals List + Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meals List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              Today's Meals
            </h2>
            {dailyData?.meals && dailyData.meals.length > 0 && (
              <Chip variant="primary" size="sm">
                {dailyData.meals.length} logged
              </Chip>
            )}
          </div>

          {loading ? (
            <Skeleton variant="card" count={2} />
          ) : !dailyData?.meals || dailyData.meals.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No meals logged today"
              description="Keep track of your fuel by logging your breakfast, lunch, dinner, or snacks."
              action={
                <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
                  Log First Meal
                </Button>
              }
            />
          ) : (
            dailyData.meals.map((meal: Meal) => (
              <Card key={meal.id} className="relative group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                        {meal.title}
                      </h3>
                      <Chip variant="secondary" size="sm" className="capitalize">
                        {meal.meal_type}
                      </Chip>
                    </div>
                    {meal.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {meal.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items */}
                {meal.items && meal.items.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {meal.items.map((item: MealItem, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span className="font-medium">
                          {item.name} <span className="text-slate-400 font-normal">({item.quantity} {item.unit})</span>
                        </span>
                        <span>
                          {item.calories} kcal | P: {item.protein_g}g | C: {item.carbs_g}g | F: {item.fat_g}g
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Weekly Chart & Patterns Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Recharts Weekly Bar Chart */}
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">
              Weekly Calorie Overview
            </h3>
            {weeklyData && weeklyData.days && weeklyData.days.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="calories" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                Weekly data will populate as you log meals.
              </p>
            )}
          </Card>

          {/* Patterns & Disclaimer Section */}
          <Card className="border-indigo-500/20 dark:border-indigo-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Dietary Patterns & Insights
              </h3>
            </div>
            {patterns?.patterns && patterns.patterns.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {patterns.patterns.map((pat, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>{pat}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Log a few days of meals to get personalized pattern analysis.
              </p>
            )}

            {/* Disclaimer Text */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                {patterns?.caution_note ||
                  'Note: Nutrition values and patterns are estimates for personal tracking, not a medical test or advice.'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log a New Meal"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMeal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Meal Title"
              placeholder="e.g. Oatmeal & Eggs, Grilled Chicken Salad"
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              required
            />
            <Select
              label="Meal Type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              options={[
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinner', label: 'Dinner' },
                { value: 'snack', label: 'Snack' },
              ]}
            />
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Ate post-workout, felt satisfied"
            value={mealNotes}
            onChange={(e) => setMealNotes(e.target.value)}
          />

          {/* Dynamic Food Items List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Food Items Breakdown
              </h4>
              <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addItemRow}>
                Add Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Food name (e.g. Oats)"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Input
                    placeholder="Unit (g/cup)"
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="w-24"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <Input
                    type="number"
                    placeholder="Calories"
                    label="Calories"
                    value={item.calories || ''}
                    onChange={(e) => updateItem(idx, 'calories', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Protein (g)"
                    label="Protein (g)"
                    value={item.protein_g || ''}
                    onChange={(e) => updateItem(idx, 'protein_g', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Carbs (g)"
                    label="Carbs (g)"
                    value={item.carbs_g || ''}
                    onChange={(e) => updateItem(idx, 'carbs_g', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Fat (g)"
                    label="Fat (g)"
                    value={item.fat_g || ''}
                    onChange={(e) => updateItem(idx, 'fat_g', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Fiber (g)"
                    label="Fiber (g)"
                    value={item.fiber_g || ''}
                    onChange={(e) => updateItem(idx, 'fiber_g', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Auto Totals */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-700 dark:text-indigo-300 flex justify-between items-center">
            <span>Calculated Total:</span>
            <span>
              {calculatedTotals.calories} kcal | P: {calculatedTotals.protein}g | C: {calculatedTotals.carbs}g | F: {calculatedTotals.fat}g | Fib: {calculatedTotals.fiber}g
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingMeal}>
              Save Meal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
