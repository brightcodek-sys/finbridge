import { useState } from 'react';
import { 
  useListAccounts, 
  useConnectAccount, 
  useDisconnectAccount,
  getListAccountsQueryKey
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Accounts() {
  const { data: accounts, isLoading } = useListAccounts();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [disconnectId, setDisconnectId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'savings' as 'savings' | 'current' | 'wallet',
  });

  const handleConnect = () => {
    connectAccount.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
          toast({
            title: 'Account connected',
            description: 'Your bank account has been successfully connected.',
          });
          setIsDialogOpen(false);
          setFormData({ bankName: '', accountNumber: '', accountType: 'savings' });
        },
        onError: () => {
          toast({
            title: 'Connection failed',
            description: 'Unable to connect account. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDisconnect = () => {
    if (!disconnectId) return;

    disconnectAccount.mutate(
      { id: disconnectId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
          toast({
            title: 'Account disconnected',
            description: 'Your bank account has been removed.',
          });
          setDisconnectId(null);
        },
        onError: () => {
          toast({
            title: 'Disconnection failed',
            description: 'Unable to disconnect account. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bank Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connected bank accounts
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-connect-account">
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., Wema Bank"
                  data-testid="input-bank-name"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g., 0123456789"
                  data-testid="input-account-number"
                />
              </div>
              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value: 'savings' | 'current' | 'wallet') =>
                    setFormData({ ...formData, accountType: value })
                  }
                >
                  <SelectTrigger id="accountType" data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleConnect}
                disabled={connectAccount.isPending}
                className="w-full"
                data-testid="button-submit-connect"
              >
                {connectAccount.isPending ? 'Connecting...' : 'Connect Account'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!accounts || accounts.length === 0 ? (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No accounts connected
          </h3>
          <p className="text-muted-foreground mb-6">
            Connect your first bank account to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-card border border-card-border rounded-lg p-6"
              data-testid={`account-${account.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {account.bankName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisconnectId(account.id)}
                  data-testid={`button-disconnect-${account.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <span className="text-sm font-mono font-medium text-card-foreground">
                    {account.accountNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-lg font-bold font-mono text-card-foreground">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    account.isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={disconnectId !== null} onOpenChange={() => setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the account from FinBridge. You can reconnect it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-disconnect"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
