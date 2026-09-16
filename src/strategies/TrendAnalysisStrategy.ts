import { Transaction } from '../models.js';
import { HistoricalDataService } from '../services/HistoricalDataService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TrendAnalysisStrategy implements AuditStrategy {
  public readonly name = 'Historical Trend Auditor';
  public readonly description =
    'Compares current monthly category spending against historical averages';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 3 - Implement this strategy.
    // 1. Call HistoricalDataService.getHistoricalAverages() asynchronously.

    const historicalAverages =
      await HistoricalDataService.getHistoricalAverages();

    // 2. Group current expenses (amount < 0) by category and compute category totals

    const currentTotals: Record<string, number> = {};

    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        currentTotals[t.category] =
          (currentTotals[t.category] || 0) + Math.abs(t.amount);
      });

    // 3. For each category, compare current total spending against the historical average.

    const allCategories = Array.from(
      new Set([
        ...Object.keys(historicalAverages),
        ...Object.keys(currentTotals),
      ]),
    );

    const comparisons = allCategories.map((category) => {
      const historical = historicalAverages[category];
      const current = currentTotals[category] || 0;

      // 4. Calculate the rate of change / variance percentage: ((current - historical) / historical) * 100.

      const variance =
        historical === undefined || historical === 0
          ? 0
          : ((current - historical) / historical) * 100;

      return {
        category,
        current,
        historical,
        variance,
      };
    });

    // 5. Highlight any category with a variance exceeding +/- 20%.

    const growthCategories = comparisons.filter((item) => item.variance > 20);

    const savingsCategories = comparisons.filter((item) => item.variance < -20);

    // 6. Format and return a text-based audit report detailing comparison metrics.

    let report = 'HISTORICAL TREND AUDIT REPORT\n\n';

    report += 'Category | Current Spending | Historical Average | Change\n';
    report += '----------------------------------------------------------\n';

    comparisons.forEach((item) => {
      const historicalDisplay =
        item.historical === undefined
          ? 'N/A'
          : `$${item.historical.toFixed(2)}`;

      const varianceDisplay =
        item.historical === undefined ? 'N/A' : `${item.variance.toFixed(1)}%`;

      report +=
        `${item.category} | ` +
        `$${item.current.toFixed(2)} | ` +
        `${historicalDisplay} | ` +
        `${varianceDisplay}\n`;
    });

    report += '\nSignificant Growth Categories\n';

    if (growthCategories.length === 0) {
      report += 'None\n';
    } else {
      growthCategories.forEach((item) => {
        report += `${item.category}: +${item.variance.toFixed(1)}%\n`;
      });
    }

    report += '\nSignificant Savings Categories\n';

    if (savingsCategories.length === 0) {
      report += 'None\n';
    } else {
      savingsCategories.forEach((item) => {
        report += `${item.category}: ${item.variance.toFixed(1)}%\n`;
      });
    }

    return report;
  }
}
