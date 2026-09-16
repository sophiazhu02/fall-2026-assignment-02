import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendAnalysisStrategy } from '../src/strategies/TrendAnalysisStrategy.js';
import { HistoricalDataService } from '../src/services/HistoricalDataService.js';
import { Transaction } from '../src/models.js';

describe('TrendAnalysisStrategy (Feature 3)', () => {
  let strategy: TrendAnalysisStrategy;

  beforeEach(() => {
    strategy = new TrendAnalysisStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should compute correct spending variances against historical averages', async () => {
  //   const mockAverages = { Food: 200, Rent: 1000 };
  //   const spy = vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(mockAverages);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -250.00, category: 'Food', description: 'Grocery', status: 'completed' }, // +25% change
  //     { id: '2', date: '2026-05-02', amount: -1000.00, category: 'Rent', description: 'Apartment', status: 'completed' }, // 0% change
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('+25'); // growth detected
  //   expect(result).toContain('Food');
  // });

  it('should group current expenses by category and compute accurate totals', async () => {
    const mockAverages = { Food: 200, Rent: 1000 };

    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue(mockAverages);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -50,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -75,
        category: 'Food',
        description: 'Restaurant',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -1000,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
      {
        id: '4',
        date: '2026-05-04',
        amount: 500,
        category: 'Food',
        description: 'Refund',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Food');
    expect(result).toContain('$125.00');
    expect(result).toContain('Rent');
    expect(result).toContain('$1000.00');
  });

  it('should calculate variance percentage from historical averages correctly', async () => {
    const mockAverages = { Food: 200, Rent: 1000 };

    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -1000,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('25.0%');
    expect(result).toContain('0.0%');
  });

  it('should highlight categories exceeding positive/negative 20% variance threshold', async () => {
    const mockAverages = { Food: 200, Entertainment: 100, Rent: 1000 };

    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -70,
        category: 'Entertainment',
        description: 'Movies',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -1000,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Significant Growth Categories');
    expect(result).toContain('Food: +25.0%');

    expect(result).toContain('Significant Savings Categories');
    expect(result).toContain('Entertainment: -30.0%');
  });

  it('should handle categories present in current data but missing in historical benchmarks', async () => {
    const mockAverages = { Food: 200 };

    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -100,
        category: 'Travel',
        description: 'Hotel',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Travel | $100.00 | N/A | N/A');
  });

  it('should format historical vs current comparisons in a readable report', async () => {
    const mockAverages = { Food: 200, Rent: 1000 };

    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -1000,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('HISTORICAL TREND AUDIT REPORT');
    expect(result).toContain(
      'Category | Current Spending | Historical Average | Change',
    );
    expect(result).toContain('Food | $250.00 | $200.00 | 25.0%');
    expect(result).toContain('Rent | $1000.00 | $1000.00 | 0.0%');
    expect(result).toContain('Significant Growth Categories');
    expect(result).toContain('Significant Savings Categories');
  });
});
