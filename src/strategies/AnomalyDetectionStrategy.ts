import { Transaction } from '../models.js';
import { AnomalyRulesService } from '../services/AnomalyRulesService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class AnomalyDetectionStrategy implements AuditStrategy {
  public readonly name = 'Anomaly & Duplicate Auditor';
  public readonly description =
    'Detects transactions exceeding thresholds and duplicate records';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 2 - Implement this strategy.
    // 1. Call AnomalyRulesService.getRules() asynchronously.
    const rules = await AnomalyRulesService.getRules();
    // 2. Scan transactions to find outliers (expenses exceeding rules.maxTransactionAmount).
    const outliers = transactions.filter(
      (transaction) =>
        transaction.amount < 0 &&
        Math.abs(transaction.amount) > rules.maxTransactionAmount,
    );
    // 3. Scan to identify duplicates (transactions sharing the exact same date, category, description, and amount).
    const duplicateMap = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const key = `${transaction.date}|${transaction.category}|${transaction.description}|${transaction.amount}`;
      const existingGroup = duplicateMap.get(key) ?? [];
      existingGroup.push(transaction);
      duplicateMap.set(key, existingGroup);
    }
    const duplicateSets = Array.from(duplicateMap.values()).filter(
      (group) => group.length >= 2,
    );
    // 4. Identify transactions having a status that matches any in rules.flaggedStatuses.
    const flaggedTransactions = transactions.filter((transaction) =>
      rules.flaggedStatuses.includes(transaction.status),
    );
    // 5. Calculate total flagged value and anomaly rates.
    const anomalousIds = new Set<string>();

    for (const transaction of outliers) {
      anomalousIds.add(transaction.id);
    }

    for (const group of duplicateSets) {
      for (const transaction of group) {
        anomalousIds.add(transaction.id);
      }
    }

    for (const transaction of flaggedTransactions) {
      anomalousIds.add(transaction.id);
    }

    const totalAnomalous = anomalousIds.size;

    const anomalyPercentage =
      transactions.length === 0
        ? 0
        : (totalAnomalous / transactions.length) * 100;
    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    let report = '=== Anomaly Detection Report ===\n\n';

    report += 'Outlier Transactions:\n';

    if (outliers.length === 0) {
      report += 'None\n';
    } else {
      for (const transaction of outliers) {
        report += `${transaction.id} | ${transaction.date} | ${transaction.category} | ${transaction.description} | ${transaction.amount.toFixed(2)}\n`;
      }
    }

    report += '\nDuplicate Transactions:\n';

    if (duplicateSets.length === 0) {
      report += 'None\n';
    } else {
      duplicateSets.forEach((group, index) => {
        report += `\nDuplicate Set ${index + 1}:\n`;

        for (const transaction of group) {
          report += `${transaction.id} | ${transaction.date} | ${transaction.category} | ${transaction.description} | ${transaction.amount.toFixed(2)}\n`;
        }
      });
    }

    report += '\nFlagged Status Transactions:\n';

    if (flaggedTransactions.length === 0) {
      report += 'None\n';
    } else {
      for (const transaction of flaggedTransactions) {
        report += `${transaction.id} | ${transaction.date} | ${transaction.category} | ${transaction.description} | ${transaction.amount.toFixed(2)} | ${transaction.status}\n`;
      }
    }

    report += '\nSummary:\n';
    report += `Total Anomalous Transactions: ${totalAnomalous}\n`;
    report += `Anomaly Percentage: ${anomalyPercentage.toFixed(2)}%\n`;

    return report;
    throw new Error('Method not implemented.');
  }
}
