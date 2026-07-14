import { useState } from 'react';
import { 
  useListTransactions, 
  useGetTransactionAnalytics 
} from '@workspace/api-client-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Transactions() {
  const [category, setCategory] = useState<string>('all');
  const [type, setType] = useState<'all' | 'credit' | 'debit'>('all');
  
  const { data: transactionList, isLoading } = useListTransactions({
    limit: 100,
    offset: 0,
    category: category === 'all' ? null : category,
    type: type === 'all' ? undefined : type,
  });
  
  const { data: analytics } = useGetTransactionAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const categories = analytics?.byCategory.map(c => c.category) || [];
  const uniqueCategories = ['all', ...new Set(categories)];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Track all your financial activity
        </p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Spending by Category
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.byCategory}>
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.byCategory}
                  dataKey="percentage"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                  style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                >
                  {analytics.byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            All Transactions
          </h2>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-32" data-testid="select-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          {!transactionList || transactionList.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions found
            </p>
          ) : (
            transactionList.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-4 border-b border-border last:border-0"
                data-testid={`transaction-row-${tx.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tx.category}</span>
                      {tx.bankName && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{tx.bankName}</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold font-mono ${
                    tx.type === 'credit' ? 'text-primary' : 'text-card-foreground'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    tx.status === 'completed' 
                      ? 'bg-primary/10 text-primary'
                      : tx.status === 'pending'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {transactionList && transactionList.total > transactionList.transactions.length && (
          <div className="mt-6 text-center">
            <Button variant="outline" data-testid="button-load-more">
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
