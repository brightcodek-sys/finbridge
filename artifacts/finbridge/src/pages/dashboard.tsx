import { useGetDashboardSummary, useGetMe } from '@workspace/api-client-react';
import { StatCard } from '@/components/ui/stat-card';
import { HealthScoreRing } from '@/components/ui/health-score-ring';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Users } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: user } = useGetMe();

  if (summaryLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your financial overview at a glance
          </p>
        </div>
        
        <HealthScoreRing score={summary.financialHealthScore} size="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(summary.totalBalance)}
          icon={Wallet}
          data-testid="stat-total-balance"
        />
        <StatCard
          label="Monthly Income"
          value={formatCurrency(summary.monthlyIncome)}
          icon={TrendingUp}
          data-testid="stat-monthly-income"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(summary.monthlyExpenses)}
          icon={TrendingDown}
          data-testid="stat-monthly-expenses"
        />
        <StatCard
          label="Savings Rate"
          value={`${summary.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          data-testid="stat-savings-rate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-card-foreground">
              Recent Transactions
            </h2>
            <Link 
              href="/transactions"
              className="text-sm font-medium text-primary hover:underline"
              data-testid="link-view-all-transactions"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {summary.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent transactions
              </p>
            ) : (
              summary.recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {tx.category}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${
                      tx.type === 'credit' ? 'text-primary' : 'text-card-foreground'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Savings</span>
                <span className="text-sm font-bold font-mono text-card-foreground">
                  {formatCurrency(summary.totalSavings)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Groups</span>
                <span className="text-sm font-bold font-mono text-card-foreground">
                  {summary.activeGroupsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Accounts</span>
                <span className="text-sm font-bold font-mono text-card-foreground">
                  {summary.accountsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Insights</span>
                <span className="text-sm font-bold font-mono text-card-foreground">
                  {summary.insightCount}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/community"
            className="block bg-primary text-primary-foreground rounded-lg p-6 hover:opacity-90 transition-opacity"
            data-testid="link-join-community"
          >
            <Users className="w-8 h-8 mb-3" />
            <h3 className="text-base font-semibold mb-1">Join a Community</h3>
            <p className="text-sm opacity-90">
              Start saving with Ajo/Esusu groups
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
