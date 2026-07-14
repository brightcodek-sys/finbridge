import { useState } from 'react';
import {
  useListSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  useContributeToGoal,
  getListSavingsGoalsQueryKey,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Savings() {
  const { data: goals, isLoading } = useListSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const contribute = useContributeToGoal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });

  const handleCreate = () => {
    createGoal.mutate(
      {
        data: {
          name: formData.name,
          targetAmount: Number(formData.targetAmount),
          deadline: formData.deadline || null,
          autoDeductEnabled: false,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() });
          toast({ title: 'Goal created', description: 'Your savings goal has been created.' });
          setIsCreateOpen(false);
          setFormData({ name: '', targetAmount: '', deadline: '' });
        },
        onError: () => {
          toast({ title: 'Failed to create goal', variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteGoal.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() });
          toast({ title: 'Goal deleted' });
          setDeleteId(null);
        },
      }
    );
  };

  const handleContribute = () => {
    if (!contributeGoalId || !contributeAmount) return;
    contribute.mutate(
      { id: contributeGoalId, data: { amount: Number(contributeAmount) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() });
          toast({ title: 'Contribution added', description: 'Your savings has been updated.' });
          setContributeGoalId(null);
          setContributeAmount('');
        },
        onError: () => {
          toast({ title: 'Contribution failed', variant: 'destructive' });
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
              <div key={i} className="h-48 bg-muted rounded-lg" />
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
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track and achieve your financial targets</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goal">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  data-testid="input-goal-name"
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount (NGN)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="e.g., 500000"
                  data-testid="input-target-amount"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  data-testid="input-deadline"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createGoal.isPending}
                className="w-full"
                data-testid="button-submit-create"
              >
                {createGoal.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!goals || goals.length === 0 ? (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No savings goals yet</h3>
          <p className="text-muted-foreground mb-6">Create your first goal to start saving</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={goal.id}
                className="bg-card border border-card-border rounded-lg p-6"
                data-testid={`goal-${goal.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground text-lg">{goal.name}</h3>
                    {daysLeft !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(goal.id)}
                    data-testid={`button-delete-${goal.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium text-card-foreground">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="text-base font-bold font-mono text-card-foreground">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="text-base font-bold font-mono text-card-foreground">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setContributeGoalId(goal.id)}
                    data-testid={`button-contribute-${goal.id}`}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Add Contribution
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this savings goal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={contributeGoalId !== null} onOpenChange={() => setContributeGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="amount">Amount (NGN)</Label>
              <Input
                id="amount"
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="e.g., 10000"
                data-testid="input-contribute-amount"
              />
            </div>
            <Button
              onClick={handleContribute}
              disabled={contribute.isPending}
              className="w-full"
              data-testid="button-submit-contribute"
            >
              {contribute.isPending ? 'Adding...' : 'Add Contribution'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
