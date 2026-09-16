import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionStrategy } from '../src/strategies/AnomalyDetectionStrategy.js';
import { AnomalyRulesService } from '../src/services/AnomalyRulesService.js';
import { Transaction } from '../src/models.js';

describe('AnomalyDetectionStrategy (Feature 2)', () => {
  let strategy: AnomalyDetectionStrategy;

  beforeEach(() => {
    strategy = new AnomalyDetectionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should detect outlier transactions exceeding threshold', async () => {
  //   const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
  //   const spy = vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -600.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Laptop');
  //   expect(result).toContain('Outlier');
  // });

  it('should detect outlier transactions exceeding the configured max amount limit', async () => {
    const mockRules = {
      maxTransactionAmount: 250.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -300.0,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('1 | 2026-05-01 | Shopping | Laptop | -300.00');
    expect(result).toContain('Anomaly Percentage: 50.00%');
  });

  it('should identify duplicate transactions sharing identical date, amount, category, and description', async () => {
    const mockRules = {
      maxTransactionAmount: 250.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',

        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'pending',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Duplicate Set 1:');
    expect(result).toContain('1 | 2026-05-02 | Food | Groceries | -100.00');
    expect(result).toContain('2 | 2026-05-02 | Food | Groceries | -100.00');
    expect(result).toContain('Anomaly Percentage: 100.00%');
  });

  it('should flag transactions matching standard flagged statuses in the rules', async () => {
    const mockRules = {
      maxTransactionAmount: 250.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -200.0,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'flagged',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain(
      '2 | 2026-05-02 | Food | Groceries | -100.00 | flagged',
    );
    expect(result).toContain('Anomaly Percentage: 50.00%');
  });

  it('should calculate correct transaction anomaly rates and total flagged valuation', async () => {
    const mockRules = {
      maxTransactionAmount: 250.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -200.0,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'flagged',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Total Anomalous Transactions: 1');
    expect(result).toContain('Anomaly Percentage: 50.00%');
  });

  it('should output a clean, readable text audit report detailing warnings', async () => {
    const mockRules = {
      maxTransactionAmount: 250.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -300.0,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('=== Anomaly Detection Report ===');
    expect(result).toContain('Outlier Transactions:');
    expect(result).toContain('1 | 2026-05-01 | Shopping | Laptop | -300.00');
    expect(result).toContain('Duplicate Transactions:\nNone');
    expect(result).toContain('Flagged Status Transactions:\nNone');
    expect(result).toContain('Summary:');
    expect(result).toContain('Total Anomalous Transactions: 1');
    expect(result).toContain('Anomaly Percentage: 50.00%');
  });
});
