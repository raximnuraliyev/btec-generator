import { useEffect, useState } from 'react';
import { tokenApi, TokenBalance } from '../services/api';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Coins, TrendingUp, Calendar, Infinity } from 'lucide-react';

interface TokenBalanceWidgetProps {
  onNavigate?: (page: 'tokens') => void;
}

export function TokenBalanceWidget({ onNavigate }: TokenBalanceWidgetProps) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tokenApi.getBalance();
      setBalance(data);
    } catch (err) {
      console.error('[TOKEN_WIDGET] Failed to load balance:', err);
      setError('Failed to load token balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-sm text-red-600">{error || 'No balance data'}</p>
      </Card>
    );
  }

  const isUnlimited = balance.planType === 'UNLIMITED';
  const isLowTokens = !isUnlimited && balance.tokensRemaining < 1000;
  const nextReset = new Date(balance.nextResetAt);
  const daysUntilReset = Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const planColors = {
    FREE: 'bg-gray-100 text-gray-800 border-gray-300',
    BASIC: 'bg-blue-100 text-blue-800 border-blue-300',
    PRO: 'bg-purple-100 text-purple-800 border-purple-300',
    UNLIMITED: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-orange-400',
  };

  return (
    <Card className={`p-4 ${isLowTokens ? 'border-orange-300 bg-orange-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className={`h-5 w-5 ${isLowTokens ? 'text-orange-600' : 'text-green-600'}`} />
          <div>
            <p className="text-xs text-gray-600">Token Balance</p>
            <p className="text-2xl font-bold">
              {isUnlimited ? (
                <span className="flex items-center gap-1">
                  <Infinity className="h-6 w-6" /> Unlimited
                </span>
              ) : (
                balance.tokensRemaining.toLocaleString()
              )}
            </p>
          </div>
        </div>
        <Badge className={`${planColors[balance.planType]} border`}>
          {balance.planType}
        </Badge>
      </div>

      {!isUnlimited && (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Usage</span>
              <span>
                {balance.tokensPerMonth - balance.tokensRemaining} / {balance.tokensPerMonth.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isLowTokens ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(
                    ((balance.tokensPerMonth - balance.tokensRemaining) / balance.tokensPerMonth) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Resets in {daysUntilReset} days</span>
            </div>
            <span>{nextReset.toLocaleDateString()}</span>
          </div>
        </>
      )}

      {isLowTokens && (
        <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
          ⚠️ Low tokens! Consider upgrading your plan.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onNavigate?.('tokens')}
        >
          View History
        </Button>
        {balance.planType !== 'UNLIMITED' && (
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            onClick={() => onNavigate?.('tokens')}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    </Card>
  );
}
