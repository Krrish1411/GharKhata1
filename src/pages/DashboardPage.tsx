import { useVault } from '../context/VaultContext';

export default function DashboardPage() {
  const { currentVaultData, privacyMode } = useVault();

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate totals
  const totalAssets = currentVaultData?.assets.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;
  const totalLiabilities = currentVaultData?.liabilities.reduce((sum, liab) => sum + liab.outstandingBalance, 0) || 0;
  
  // People ledger net position (lent - borrowed)
  const totalLent = currentVaultData?.peopleLedger
    .filter(e => e.type === 'lent' && e.status !== 'closed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const totalBorrowed = currentVaultData?.peopleLedger
    .filter(e => e.type === 'borrowed' && e.status !== 'closed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;

  // Net Worth = Assets - Liabilities - (Borrowed - Lent)
  const netWorth = totalAssets - totalLiabilities - (totalBorrowed - totalLent);

  // Calculate Financial Health Score (0-100)
  function calculateHealthScore(): { score: number; breakdown: Array<{ label: string; value: number; max: number; help: string }> } {
    if (!currentVaultData) return { score: 0, breakdown: [] };

    const breakdown: Array<{ label: string; value: number; max: number; help: string }> = [];
    
    // 1. Savings Rate (30 points) - based on income vs expenses
    const transactions = currentVaultData.transactions || [];
    const incomeTransactions = transactions.filter(t => {
      const category = currentVaultData.categories?.find(c => c.id === t.categoryId);
      return category?.type === 'income';
    });
    const expenseTransactions = transactions.filter(t => {
      const category = currentVaultData.categories?.find(c => c.id === t.categoryId);
      return category?.type === 'expense';
    });
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    let savingsRateScore = 0;
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      savingsRateScore = Math.min(30, Math.max(0, savingsRate * 0.3)); // Scale to 30 points
    } else {
      savingsRateScore = 15; // Neutral if no data
    }
    breakdown.push({
      label: 'Savings Rate',
      value: savingsRateScore,
      max: 30,
      help: totalIncome > 0 
        ? `${((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}% of income saved`
        : 'No income data yet',
    });

    // 2. Debt-to-Income (25 points) - lower is better
    let debtToIncomeScore = 25;
    if (totalIncome > 0 && totalLiabilities > 0) {
      const monthlyEMI = currentVaultData.liabilities?.reduce((sum, l) => sum + l.emiAmount, 0) || 0;
      const debtRatio = (monthlyEMI / totalIncome) * 100;
      debtToIncomeScore = Math.max(0, 25 - (debtRatio * 0.5)); // Reduce score as ratio increases
    }
    breakdown.push({
      label: 'Debt Management',
      value: debtToIncomeScore,
      max: 25,
      help: totalLiabilities > 0 ? `₹${totalLiabilities.toLocaleString('en-IN')} total debt` : 'No formal debt',
    });

    // 3. Emergency Fund Coverage (20 points)
    let emergencyFundScore = 0;
    const liquidAssets = currentVaultData.accounts
      ?.filter(a => a.type === 'bank' || a.type === 'cash' || a.type === 'wallet' || a.type === 'upi')
      .reduce((sum, a) => sum + a.balance, 0) || 0;
    
    const monthlyExpenses = totalExpenses > 0 ? totalExpenses : 30000; // Default estimate
    const monthsCovered = liquidAssets / monthlyExpenses;
    emergencyFundScore = Math.min(20, monthsCovered * 3.33); // 6 months = full score
    breakdown.push({
      label: 'Emergency Fund',
      value: emergencyFundScore,
      max: 20,
      help: `${monthsCovered.toFixed(1)} months of expenses covered`,
    });

    // 4. Budget Adherence (15 points)
    let budgetScore = 15;
    const budgets = currentVaultData.budgets || [];
    if (budgets.length > 0) {
      const overBudgetCount = budgets.filter(b => {
        const spent = transactions
          .filter(t => {
            const transDate = new Date(t.date);
            const now = new Date();
            return t.categoryId === b.categoryId && 
                   transDate.getMonth() === now.getMonth() && 
                   transDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return spent > b.budgetedAmount;
      }).length;
      budgetScore = Math.max(0, 15 - (overBudgetCount * 3));
    }
    breakdown.push({
      label: 'Budget Adherence',
      value: budgetScore,
      max: 15,
      help: budgets.length > 0 ? `${budgets.length} budgets active` : 'No budgets set',
    });

    // 5. Net Worth Trend (10 points) - simplified, would need historical data for real trend
    const netWorthScore = netWorth >= 0 ? 10 : 5;
    breakdown.push({
      label: 'Net Worth',
      value: netWorthScore,
      max: 10,
      help: netWorth >= 0 ? 'Positive net worth' : 'Negative net worth',
    });

    const totalScore = Math.round(savingsRateScore + debtToIncomeScore + emergencyFundScore + budgetScore + netWorthScore);
    
    return { score: Math.min(100, Math.max(0, totalScore)), breakdown };
  }

  const healthScore = calculateHealthScore();

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your finances
        </p>
      </div>

      {/* Financial Health Score */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 dark:from-navy-900 dark:to-navy-950 rounded-lg shadow p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium opacity-80 mb-2">Financial Health Score</h2>
            <p className={`text-4xl font-bold ${getScoreColor(healthScore.score)}`}>
              {healthScore.score}/100
            </p>
            <p className="text-sm opacity-75 mt-1">{getScoreLabel(healthScore.score)}</p>
          </div>
          <div className="text-right">
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={healthScore.score >= 80 ? '#22c55e' : healthScore.score >= 60 ? '#eab308' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore.score * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {healthScore.breakdown.map((item, idx) => (
            <div key={idx} className="bg-white/10 rounded-lg p-3">
              <p className="text-xs opacity-70 mb-1">{item.label}</p>
              <p className="text-lg font-semibold">{item.value.toFixed(0)}/{item.max}</p>
              <p className="text-xs opacity-60 truncate" title={item.help}>{item.help}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Net Worth
        </h2>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatAmount(netWorth)}
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAmount(totalAssets)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Liabilities</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAmount(totalLiabilities)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lent Out</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(totalLent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Borrowed</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatAmount(totalBorrowed)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Accounts
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.accounts.length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Transactions
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.transactions.length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Assets
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.assets.length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Liabilities
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.liabilities.length || 0}
          </p>
        </div>
      </div>

      {/* Empty states for first-time users */}
      {!currentVaultData || (
        currentVaultData.accounts.length === 0 &&
        currentVaultData.transactions.length === 0 &&
        currentVaultData.assets.length === 0
      ) ? (
        <div className="bg-marigold-400/10 dark:bg-marigold-400/20 border border-marigold-400/20 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-marigold-600 dark:text-marigold-400 mb-2">
            Get started with your vault
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first account to start tracking your finances
          </p>
          <button className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Add Account
          </button>
        </div>
      ) : null}
    </div>
  );
}
