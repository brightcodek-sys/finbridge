// Mock database for accounts and transactions

interface Account {
  id: string;
  userId: string;
  bank: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

const getAccountsFromStorage = (): Account[] => {
  const stored = localStorage.getItem('finbridge_accounts');
  return stored ? JSON.parse(stored) : [];
};

const getTransactionsFromStorage = (): Transaction[] => {
  const stored = localStorage.getItem('finbridge_transactions');
  if (!stored) {
    // Initialize with mock data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        userId: '1',
        accountId: '1',
        description: 'Salary Deposit',
        amount: 500000,
        type: 'income',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Salary',
      },
      {
        id: '2',
        userId: '1',
        accountId: '1',
        description: 'Grocery Shopping',
        amount: 25000,
        type: 'expense',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Food',
      },
      {
        id: '3',
        userId: '1',
        accountId: '1',
        description: 'Electricity Bill',
        amount: 15000,
        type: 'expense',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Utilities',
      },
    ];
    localStorage.setItem('finbridge_transactions', JSON.stringify(mockTransactions));
    return mockTransactions;
  }
  return JSON.parse(stored);
};

const saveAccountsToStorage = (accounts: Account[]) => {
  localStorage.setItem('finbridge_accounts', JSON.stringify(accounts));
};

const saveTransactionsToStorage = (transactions: Transaction[]) => {
  localStorage.setItem('finbridge_transactions', JSON.stringify(transactions));
};

export const getUserAccounts = (userId: string): Account[] => {
  const accounts = getAccountsFromStorage();
  const userAccounts = accounts.filter(a => a.userId === userId);
  
  // If no accounts, create default account
  if (userAccounts.length === 0) {
    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      bank: 'WEMA Bank',
      accountNumber: '1234567890',
      balance: 250000,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAccount);
    saveAccountsToStorage(accounts);
    return [newAccount];
  }
  
  return userAccounts;
};

export const getUserTransactions = (userId: string): Transaction[] => {
  const transactions = getTransactionsFromStorage();
  return transactions.filter(t => t.userId === userId);
};

export const addAccount = (
  userId: string,
  bank: string,
  accountNumber: string,
  balance: number
): Account => {
  const accounts = getAccountsFromStorage();
  const newAccount: Account = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    bank,
    accountNumber,
    balance,
    createdAt: new Date().toISOString(),
  };
  accounts.push(newAccount);
  saveAccountsToStorage(accounts);
  return newAccount;
};

export const addTransaction = (
  userId: string,
  accountId: string,
  description: string,
  amount: number,
  type: 'income' | 'expense',
  category: string
): Transaction => {
  const transactions = getTransactionsFromStorage();
  const newTransaction: Transaction = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    accountId,
    description,
    amount,
    type,
    date: new Date().toISOString(),
    category,
  };
  transactions.push(newTransaction);
  saveTransactionsToStorage(transactions);
  return newTransaction;
};
