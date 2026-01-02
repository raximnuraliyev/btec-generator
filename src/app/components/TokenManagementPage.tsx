import { useEffect, useState } from 'react';
import { tokenApi, TokenBalance, TokenTransaction, TokenPlanInfo } from '../services/api';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Coins, TrendingUp, Calendar, History, Check, Infinity, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface TokenManagementPageProps {
  onNavigate: (page: 'dashboard') => void;
}

export function TokenManagementPage({ onNavigate }: TokenManagementPageProps) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [plans, setPlans] = useState<TokenPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, historyData, plansData] = await Promise.all([
        tokenApi.getBalance(),
        tokenApi.getHistory(50),
        tokenApi.getPlans(),
      ]);
      setBalance(balanceData);
      setTransactions(historyData.transactions);
      setPlans(plansData.plans);
    } catch (err) {
      console.error('[TOKEN_PAGE] Failed to load data:', err);
      toast.error('Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'BASIC' | 'PRO' | 'UNLIMITED') => {
    try {
      setUpgrading(planType);
      await tokenApi.upgradePlan(planType);
      toast.success(`Successfully upgraded to ${planType} plan!`);
      await loadData();
    } catch (err: any) {
      console.error('[TOKEN_PAGE] Upgrade failed:', err);
      toast.error(err.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Token Management</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const transactionTypeColors = {
    ASSIGNMENT_GENERATION: 'bg-red-100 text-red-800',
    PLAN_UPGRADE: 'bg-green-100 text-green-800',
    ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-800',
    MONTHLY_RESET: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Coins className="h-8 w-8 text-green-600" />
        Token Management
      </h1>

      {/* Current Balance */}
      {balance && (
        <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-4xl font-bold text-gray-900">
                {balance.planType === 'UNLIMITED' ? (
                  <span className="flex items-center gap-2">
                    <Infinity className="h-10 w-10" /> Unlimited
                  </span>
                ) : (
                  balance.tokensRemaining.toLocaleString()
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {balance.planType !== 'UNLIMITED' &&
                  `of ${balance.tokensPerMonth.toLocaleString()} tokens/month`}
              </p>
            </div>
            <div className="text-right">
              <Badge className="text-lg px-4 py-2 mb-2">
                {balance.planType} Plan
              </Badge>
              {balance.planType !== 'UNLIMITED' && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Resets: {new Date(balance.nextResetAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      {balance?.planType !== 'UNLIMITED' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Upgrade Your Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {plans
              .filter((p) => p.type !== 'FREE')
              .map((plan) => {
                const isCurrent = balance?.planType === plan.type;
                const isUnlimited = plan.type === 'UNLIMITED';

                return (
                  <Card
                    key={plan.type}
                    className={`p-6 ${
                      isUnlimited
                        ? 'border-2 border-orange-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                        : isCurrent
                        ? 'border-2 border-blue-400 bg-blue-50'
                        : ''
                    }`}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-1">{plan.type}</h3>
                      <p className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                        <span className="text-sm text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {isUnlimited ? (
                          <span className="flex items-center gap-1 font-semibold text-orange-600">
                            <Infinity className="h-4 w-4" /> Unlimited tokens
                          </span>
                        ) : (
                          `${plan.tokensPerMonth.toLocaleString()} tokens/month`
                        )}
                      </p>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      disabled={isCurrent || upgrading !== null}
                      onClick={() => handleUpgrade(plan.type as any)}
                      variant={isUnlimited ? 'default' : 'outline'}
                    >
                      {isCurrent
                        ? 'Current Plan'
                        : upgrading === plan.type
                        ? 'Upgrading...'
                        : 'Upgrade'}
                    </Button>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <History className="h-6 w-6" />
          Transaction History
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!transactions || transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={transactionTypeColors[tx.type]}>
                          {tx.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.description}
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-semibold ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
