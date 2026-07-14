import { useState } from 'react';
import { useGetMe, useSubmitKyc, getGetMeQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, CheckCircle, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const tiers = [
  {
    name: 'Basic',
    value: 'basic',
    features: [
      'View account balances',
      'Basic transaction history',
      'Limited savings goals (up to 2)',
      'No community groups',
    ],
    limits: 'NGN 50,000 daily limit',
  },
  {
    name: 'Intermediate',
    value: 'intermediate',
    features: [
      'All Basic features',
      'Unlimited savings goals',
      'Join community groups (up to 3)',
      'Basic financial insights',
      'Transaction analytics',
    ],
    limits: 'NGN 500,000 daily limit',
    required: 'BVN verification required',
  },
  {
    name: 'Full',
    value: 'full',
    features: [
      'All Intermediate features',
      'Create community groups',
      'Advanced financial insights',
      'Priority support',
      'Custom savings automation',
      'Export financial reports',
    ],
    limits: 'Unlimited transactions',
    required: 'BVN + NIN + Address verification required',
  },
];

export default function KYC() {
  const { data: user, isLoading } = useGetMe();
  const submitKyc = useSubmitKyc();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTier, setSelectedTier] = useState<'intermediate' | 'full'>('intermediate');
  const [formData, setFormData] = useState({
    bvn: '',
    nin: '',
    address: '',
  });

  const handleSubmit = () => {
    submitKyc.mutate(
      {
        data: {
          tier: selectedTier,
          bvn: formData.bvn || null,
          nin: selectedTier === 'full' ? formData.nin || null : null,
          address: selectedTier === 'full' ? formData.address || null : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: 'KYC upgrade submitted',
            description: 'Your verification is being processed.',
          });
          setFormData({ bvn: '', nin: '', address: '' });
        },
        onError: () => {
          toast({
            title: 'Submission failed',
            description: 'Unable to process KYC upgrade. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Unable to load user data.</p>
      </div>
    );
  }

  const currentTierIndex = tiers.findIndex((t) => t.value === user.kycTier);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">KYC Verification</h1>
        <p className="text-muted-foreground mt-1">
          Upgrade your account tier to unlock more features
        </p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-card-foreground">Current Tier</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-primary font-mono">
            {user.kycTier.charAt(0).toUpperCase() + user.kycTier.slice(1)}
          </span>
          {user.bvn && (
            <span className="text-sm text-muted-foreground">BVN verified</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier, index) => {
          const isActive = tier.value === user.kycTier;
          const isCompleted = index < currentTierIndex;
          const isAvailable = index === currentTierIndex + 1;

          return (
            <div
              key={tier.value}
              className={`bg-card border rounded-lg p-6 ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20'
                  : isCompleted
                  ? 'border-primary/50'
                  : 'border-card-border'
              } ${!isAvailable && !isActive && !isCompleted ? 'opacity-60' : ''}`}
              data-testid={`tier-${tier.value}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-card-foreground">{tier.name}</h3>
                {isActive && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    CURRENT
                  </span>
                )}
                {isCompleted && <CheckCircle className="w-5 h-5 text-primary" />}
                {!isAvailable && !isActive && !isCompleted && (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">FEATURES</p>
                  <ul className="space-y-1.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-sm text-card-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">LIMITS</p>
                  <p className="text-sm font-medium text-card-foreground">{tier.limits}</p>
                </div>

                {tier.required && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">TO UPGRADE</p>
                    <p className="text-sm text-card-foreground">{tier.required}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {user.kycTier !== 'full' && (
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-6">
            Upgrade Your Account
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <Button
                variant={selectedTier === 'intermediate' ? 'default' : 'outline'}
                onClick={() => setSelectedTier('intermediate')}
                data-testid="button-select-intermediate"
              >
                Upgrade to Intermediate
              </Button>
              <Button
                variant={selectedTier === 'full' ? 'default' : 'outline'}
                onClick={() => setSelectedTier('full')}
                data-testid="button-select-full"
              >
                Upgrade to Full
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                <Input
                  id="bvn"
                  value={formData.bvn}
                  onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  data-testid="input-bvn"
                />
              </div>

              {selectedTier === 'full' && (
                <>
                  <div>
                    <Label htmlFor="nin">National Identity Number (NIN)</Label>
                    <Input
                      id="nin"
                      value={formData.nin}
                      onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                      placeholder="Enter your 11-digit NIN"
                      maxLength={11}
                      data-testid="input-nin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Residential Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your full residential address"
                      rows={3}
                      data-testid="input-address"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitKyc.isPending || !formData.bvn}
                className="w-full"
                data-testid="button-submit-kyc"
              >
                {submitKyc.isPending ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
