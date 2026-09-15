import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetLimitStrategy } from '../src/strategies/BudgetLimitStrategy.js';
import { BudgetService } from '../src/services/BudgetService.js';
import { Transaction } from '../src/models.js';

describe('BudgetLimitStrategy (Feature 1)', () => {
  let strategy: BudgetLimitStrategy;

  beforeEach(() => {
    strategy = new BudgetLimitStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should correctly identify categories that are over budget', async () => {
  //   // 1. Mock the BudgetService asynchronously
  //   const mockBudgets = { Food: 100, Rent: 1000 };
  //   const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);
  //
  //   // 2. Set up test transactions
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -150.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Over budget
  //     { id: '2', date: '2026-05-02', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' }, // Under budget
  //   ];
  //
  //   // 3. Execute
  //   const result = await strategy.execute(testTransactions);
  //
  //   // 4. Assert
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Food');
  //   expect(result).toContain('OVER BUDGET'); // or whatever formatting you choose
  //   expect(result).not.toContain('Rent over budget');
  // });

  it('should group expenses correctly by category and sum them', async() => {
    const mockBudgets = {Rent: 1000};
    const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-09-09', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' },
       { id: '2', date: '2026-09-10', amount: -150.00, category: 'Rent', description: 'Apartment', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Rent');
    expect(result).toContain('1050');
  });

  it('should calculate absolute overage amounts and percentage exceeded', async() => {
    const mockBudgets = {Rent: 1000};
    const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-09-09', amount: -1100.00, category: 'Rent', description: 'Apartment', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Overage Amount: $100');
    expect(result).toContain('Percentages: 110.00%');
  });

  it('should list the specific transactions contributing to categories that are over budget', async() => {
    const mockBudgets = {Rent: 1000};
    const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-09-09', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' },
       { id: '2', date: '2026-09-10', amount: -150.00, category: 'Rent', description: 'Apartment', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Cause of Overage:');
    expect(result).toContain('Apartment: $900');
    expect(result).toContain('Apartment: $150');
  });

  it('should handle scenarios where no categories are over budget', async() => {
    const mockBudgets = {Rent: 1000};
    const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-09-09', amount: -999.00, category: 'Rent', description: 'Apartment', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe('');
  });

  it('should handle empty transaction list gracefully', async() => {
    const mockBudgets = {Rent: 1000};
    const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe('');
  });
});
