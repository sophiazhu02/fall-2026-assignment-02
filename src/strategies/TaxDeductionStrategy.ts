import { AuditStrategy } from './AuditStrategy.js';
import { Transaction } from '../models.js';
import { TaxConfigService } from '../services/TaxConfigService.js';

export class TaxDeductionStrategy implements AuditStrategy {
  name = 'Tax & Deductions Auditor';

  async execute(
    transactions: Transaction[],
    _customParam?: string,
  ): Promise<string> {
    // 1. Asynchronously fetch tax configuration from the service
    const config = await TaxConfigService.getTaxConfig();
    const standardTaxRate = config.standardTaxRate;
    const deductibleCategories = config.deductibleCategories || [];

    // Case-insensitive lookup set for qualifying categories
    const deductibleCategorySet = new Set(
      deductibleCategories.map((cat) => cat.trim().toLowerCase()),
    );

    // 2. Separate expense transactions (amount < 0) into deductible vs non-deductible
    const deductibleTransactions: Transaction[] = [];
    let totalDeductions = 0;
    let totalNonDeductibleExpenses = 0;

    for (const tx of transactions) {
      if (tx.amount < 0) {
        const absAmount = Math.abs(tx.amount);
        const categoryKey = tx.category.trim().toLowerCase();

        if (deductibleCategorySet.has(categoryKey)) {
          deductibleTransactions.push(tx);
          totalDeductions += absAmount;
        } else {
          totalNonDeductibleExpenses += absAmount;
        }
      }
    }

    // 3. Tax calculations
    const estimatedTaxSavings = totalDeductions * standardTaxRate;
    const estimatedSalesTaxPaid = totalNonDeductibleExpenses * standardTaxRate;

    // 4. Build report output
    const lines: string[] = [];
    lines.push('==================================================');
    lines.push('          TAX & DEDUCTIONS AUDIT REPORT           ');
    lines.push('==================================================');
    lines.push(`Applied Tax Rate: ${(standardTaxRate * 100).toFixed(2)}%`);
    lines.push(
      `Eligible Deductible Categories: ${deductibleCategories.join(', ')}`,
    );
    lines.push('--------------------------------------------------');
    lines.push('QUALIFYING DEDUCTIBLE TRANSACTIONS:');

    if (deductibleTransactions.length === 0) {
      lines.push('  None found.');
    } else {
      deductibleTransactions.forEach((tx) => {
        const dateStr = tx.date
          ? new Date(tx.date).toISOString().split('T')[0]
          : 'N/A';
        lines.push(
          `  - [${dateStr}] ${tx.category.padEnd(12)} | ${tx.description.padEnd(25)} | $${Math.abs(tx.amount).toFixed(2)}`,
        );
      });
    }

    lines.push('--------------------------------------------------');
    lines.push('SUMMARY:');
    lines.push(`  Total Deductible Expenses:   $${totalDeductions.toFixed(2)}`);
    lines.push(
      `  Estimated Tax Savings:       $${estimatedTaxSavings.toFixed(2)}`,
    );
    lines.push(
      `  Non-Deductible Expenses:     $${totalNonDeductibleExpenses.toFixed(2)}`,
    );
    lines.push(
      `  Estimated Sales Tax (VAT):   $${estimatedSalesTaxPaid.toFixed(2)}`,
    );
    lines.push('==================================================');

    return lines.join('\n');
  }
}
