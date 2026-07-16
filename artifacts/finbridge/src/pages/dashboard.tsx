import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, LogOut, Plus } from 'lucide-react';
import { getUser, logoutUser } from '@/lib/auth';
import { getUserAccounts, getUserTransactions } from '@/lib/database';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      setLocation('/login');
      return;
    }
    
    setUser(currentUser);
    setAccounts(getUserAccounts(currentUser.id) || []);
    setTransactions(getUserTransactions(currentUser.id) || []);
    setIsLoading(false);
  }, [setLocation]);

  const handleLogout = () => {
    logoutUser();
    setLocation('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {user.firstName}!</h1>
              <p className="text-blue-100 mt-1">Your financial overview at a glance</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 text-white border-white hover:bg-blue-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{totalBalance.toLocaleString()}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">₦{monthlyIncome.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">₦{monthlyExpenses.toLocaleString()}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Savings</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">₦{(monthlyIncome - monthlyExpenses).toLocaleString()}</p>
                </div>
                <PiggyBank className="w-10 h-10 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Accounts</h2>
            <Button className="gap-2" onClick={() => setLocation('/accounts')}>
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
          </div>
          
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No connected accounts yet. Link your bank account to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{account.bank}</CardTitle>
                    <CardDescription>{account.accountNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">₦{account.balance.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}