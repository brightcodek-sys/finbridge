import { useState } from 'react';
import {
  useListCommunityGroups,
  useGetCommunityGroup,
  useCreateCommunityGroup,
  useJoinCommunityGroup,
  getListCommunityGroupsQueryKey,
  getGetCommunityGroupQueryKey,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Community() {
  const { data: groups, isLoading } = useListCommunityGroups();
  const createGroup = useCreateCommunityGroup();
  const joinGroup = useJoinCommunityGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewGroupId, setViewGroupId] = useState<number | null>(null);
  const { data: groupDetail } = useGetCommunityGroup(viewGroupId!, {
    query: {
      enabled: !!viewGroupId,
      queryKey: getGetCommunityGroupQueryKey(viewGroupId!),
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    cycleDays: '',
  });

  const handleCreate = () => {
    createGroup.mutate(
      {
        data: {
          name: formData.name,
          description: formData.description,
          contributionAmount: Number(formData.contributionAmount),
          cycleDays: Number(formData.cycleDays),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
          toast({ title: 'Group created', description: 'Your community group has been created.' });
          setIsCreateOpen(false);
          setFormData({ name: '', description: '', contributionAmount: '', cycleDays: '' });
        },
        onError: () => {
          toast({ title: 'Failed to create group', variant: 'destructive' });
        },
      }
    );
  };

  const handleJoin = (groupId: number) => {
    joinGroup.mutate(
      { id: groupId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCommunityGroupQueryKey(groupId) });
          toast({ title: 'Joined group', description: 'You are now a member of this group.' });
        },
        onError: () => {
          toast({ title: 'Failed to join group', variant: 'destructive' });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-muted rounded-lg" />
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
          <h1 className="text-3xl font-bold text-foreground">Community Savings</h1>
          <p className="text-muted-foreground mt-1">Join or create Ajo/Esusu savings groups</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Community Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Savers Circle"
                  data-testid="input-group-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the group purpose and rules"
                  data-testid="input-description"
                />
              </div>
              <div>
                <Label htmlFor="contributionAmount">Contribution Amount (NGN)</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, contributionAmount: e.target.value })
                  }
                  placeholder="e.g., 50000"
                  data-testid="input-contribution-amount"
                />
              </div>
              <div>
                <Label htmlFor="cycleDays">Cycle Duration (Days)</Label>
                <Input
                  id="cycleDays"
                  type="number"
                  value={formData.cycleDays}
                  onChange={(e) => setFormData({ ...formData, cycleDays: e.target.value })}
                  placeholder="e.g., 30"
                  data-testid="input-cycle-days"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createGroup.isPending}
                className="w-full"
                data-testid="button-submit-create"
              >
                {createGroup.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!groups || groups.length === 0 ? (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No community groups yet
          </h3>
          <p className="text-muted-foreground mb-6">Create the first group to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-card border border-card-border rounded-lg p-6"
              data-testid={`group-${group.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-card-foreground text-lg">{group.name}</h3>
                {group.isMember && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    Member
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {group.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members
                  </span>
                  <span className="font-medium text-card-foreground">{group.memberCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Contribution
                  </span>
                  <span className="font-bold font-mono text-card-foreground">
                    {formatCurrency(group.contributionAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Cycle
                  </span>
                  <span className="font-medium text-card-foreground">
                    {group.cycleDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Pool</span>
                  <span className="font-bold font-mono text-card-foreground">
                    {formatCurrency(group.totalPool)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewGroupId(group.id)}
                  data-testid={`button-view-${group.id}`}
                >
                  View Details
                </Button>
                {!group.isMember && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleJoin(group.id)}
                    disabled={joinGroup.isPending}
                    data-testid={`button-join-${group.id}`}
                  >
                    Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={viewGroupId !== null} onOpenChange={() => setViewGroupId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{groupDetail?.name}</DialogTitle>
          </DialogHeader>
          {groupDetail && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{groupDetail.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Contribution</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(groupDetail.contributionAmount)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Pool</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(groupDetail.totalPool)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-card-foreground mb-3">
                  Members ({groupDetail.members.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {groupDetail.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
                      data-testid={`member-${member.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Order #{member.rotationOrder}
                        </p>
                      </div>
                      {member.hasPaidCurrentCycle ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
