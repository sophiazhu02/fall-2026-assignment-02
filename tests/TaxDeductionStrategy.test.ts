import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaxDeductionStrategy } from '../src/strategies/TaxDeductionStrategy.js';
import { TaxConfigService } from '../src/services/TaxConfigService.js';
import { Transaction } from '../src/models.js';

describe('TaxDeductionStrategy', () => {
  let strategy: TaxDeductionStrategy;

  // Mock matches your professor's exact TaxConfig interface
  const mockTaxConfig = {
    standardTaxRate: 0.20, // 20%
    deductibleCategories: ['Charity', 'Business', 'Medical'],
  };

  beforeEach(() => {
    strategy = new TaxDeductionStrategy();
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockTaxConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1: correctly calculates deductions, savings, and non-deductible VAT on standard input', async () => {
    const mockTransactions: Transaction[] = [
      { id: '1', date: '2026-01-10', category: 'Charity', description: 'Red Cross Donation', amount: -100, status: 'completed' },
      { id: '2', date: '2026-01-12', category: 'Business', description: 'Software License', amount: -200, status: 'completed' },
      { id: '3', date: '2026-01-15', category: 'Groceries', description: 'Supermarket', amount: -50, status: 'completed' },
      { id: '4', date: '2026-01-20', category: 'Entertainment', description: 'Cinema', amount: -30, status: 'completed' },
    ];

    const result = await strategy.execute(mockTransactions);

    // Verify service call
    expect(TaxConfigService.getTaxConfig).toHaveBeenCalledTimes(1);

    // Deductible: 100 + 200 = 300. Savings: 300 * 0.20 = 60.00
    expect(result).toContain('Total Deductible Expenses:   $300.00');
    expect(result).toContain('Estimated Tax Savings:       $60.00');

    // Non-deductible: 50 + 30 = 80. VAT: 80 * 0.20 = 16.00
    expect(result).toContain('Non-Deductible Expenses:     $80.00');
    expect(result).toContain('Estimated Sales Tax (VAT):   $16.00');

    // Qualifying items are listed
    expect(result).toContain('Red Cross Donation');
    expect(result).toContain('Software License');
    expect(result).not.toContain('Cinema');
  });

  it('Scenario 2: handles empty transaction list gracefully without crashing', async () => {
    const result = await strategy.execute([]);

    expect(result).toContain('Total Deductible Expenses:   $0.00');
    expect(result).toContain('Estimated Tax Savings:       $0.00');
    expect(result).toContain('Non-Deductible Expenses:     $0.00');
    expect(result).toContain('Estimated Sales Tax (VAT):   $0.00');
    expect(result).toContain('None found.');
  });

  it('Scenario 3: ignores income transactions and handles case-insensitive categories', async () => {
    const mockTransactions: Transaction[] = [
      // Income should not be deducted even if category is 'Business'
      { id: '1', date: '2026-02-01', category: 'Business', description: 'Client Payment', amount: 1500, status: 'completed' },
      // Lowercase category check ('medical' vs 'Medical')
      { id: '2', date: '2026-02-05', category: 'medical', description: 'Dentist Visit', amount: -250, status: 'completed' },
      // Non-deductible expense
      { id: '3', date: '2026-02-10', category: 'Utilities', description: 'Electric Bill', amount: -100, status: 'completed' },
    ];

    const result = await strategy.execute(mockTransactions);

    // Deductible: Dentist Visit (250). Savings: 250 * 0.20 = 50.00
    expect(result).toContain('Total Deductible Expenses:   $250.00');
    expect(result).toContain('Estimated Tax Savings:       $50.00');
    expect(result).toContain('Dentist Visit');

    // Non-deductible: Electric Bill (100). VAT: 100 * 0.20 = 20.00
    expect(result).toContain('Non-Deductible Expenses:     $100.00');
    expect(result).toContain('Estimated Sales Tax (VAT):   $20.00');
    expect(result).not.toContain('Client Payment');
  });
});