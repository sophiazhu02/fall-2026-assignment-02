import { Transaction } from '../models.js';
import { BudgetService } from '../services/BudgetService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class BudgetLimitStrategy implements AuditStrategy {
  public readonly name = 'Budget Limit Auditor';
  public readonly description =
    'Checks category spending against monthly budget limits';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 1 - Implement this strategy.
    // 1. Call BudgetService.getCategoryBudgets() asynchronously.
    const budgets = await BudgetService.getCategoryBudgets();
    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    const expenses = transactions.filter(transaction => transaction.amount < 0);
    const categories = new Map<string,number>();
    for(const transaction of expenses){
      let total = 0;
      const currentTotal = categories.get(transaction.category) ?? 0;
      total = currentTotal + Math.abs(transaction.amount);
      categories.set(transaction.category, total);
    }
    // 3. Compare spending against the fetched limits.
    // 4. Identify overages (categories where spending exceeds the budget). 
    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.
    let auditReport = "";

    for(const [category, spending] of categories){
      if(spending > budgets[category]){
        const overage = spending - budgets[category];
        const percentages = (((spending - budgets[category]) / budgets[category]) * 100).toFixed(2);
        const causeOfOverage = transactions.filter(transaction => transaction.category === category && transaction.amount < 0);
        auditReport += `Category: ${category}\n`;
        auditReport += `Budget Limit: $${budgets[category]}\n`;
        auditReport += `Actuals: $${spending}\n`;
        auditReport += `Overage Amount: $${overage}\n`;
        auditReport += `Percentages: ${percentages}%\n`;
        auditReport += `Cause of Overage:\n`;
        for(const transaction of causeOfOverage){
          auditReport += `${transaction.description}: $${Math.abs(transaction.amount)}\n`;
        }
      }
    }
    return auditReport;

  }
}
