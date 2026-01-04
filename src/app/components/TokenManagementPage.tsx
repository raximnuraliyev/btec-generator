import { useEffect, useState } from 'react';
import { 
  tokenApi, 
  TokenBalance, 
  TokenTransaction, 
  paymentApi,
  PaymentPlan,
  PaymentTransaction as PaymentTx,
  PaymentPlanType,
  PaymentMethod,
  GradeType
} from '../services/api';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Coins, 
  Calendar, 
  History, 
  Check, 
  Infinity, 
  ArrowLeft,
  CreditCard,
  Clock,
  AlertTriangle,
  Copy,
  RefreshCw,
  Zap,
  Star,
  Crown,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface TokenManagementPageProps {
  onNavigate: (page: 'dashboard') => void;
}

const CARD_NUMBER = '9680 3501 4687 8359';

export function TokenManagementPage({ onNavigate }: TokenManagementPageProps) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment state
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [activePayment, setActivePayment] = useState<PaymentTx | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTx[]>([]);
  const [creating, setCreating] = useState<PaymentPlanType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanType | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Custom plan state
  const [customTokens, setCustomTokens] = useState(10000);
  const [customGrade, setCustomGrade] = useState<GradeType>('PASS');
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('HUMO');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, historyData, plansRes, activeRes, paymentHistoryRes] = await Promise.all([
        tokenApi.getBalance(),
        tokenApi.getHistory(50),
        paymentApi.getPlans(),
        paymentApi.getActivePayment(),
        paymentApi.getPaymentHistory(),
      ]);
      setBalance(balanceData);
      setTransactions(historyData.transactions);
      setPaymentPlans(plansRes.plans);
      setActivePayment(activeRes.payment);
      setPaymentHistory(paymentHistoryRes.payments);
    } catch (err) {
      console.error('[TOKEN_PAGE] Failed to load data:', err);
      toast.error('Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planType: PaymentPlanType) => {
    setSelectedPlan(planType);
    if (planType !== 'CUSTOM') {
      setShowPaymentModal(true);
    }
  };

  const calculateCustom = async () => {
    try {
      const res = await paymentApi.calculateCustomPrice(customTokens);
      setCustomPrice(res.price);
    } catch (err: any) {
      toast.error(err.message || 'Failed to calculate price');
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan) return;

    try {
      setCreating(selectedPlan);
      const res = await paymentApi.createPayment({
        planType: selectedPlan,
        paymentMethod,
        customTokens: selectedPlan === 'CUSTOM' ? customTokens : undefined,
        customGrade: selectedPlan === 'CUSTOM' ? customGrade : undefined,
      });
      
      setActivePayment(res.payment);
      setShowPaymentModal(false);
      setSelectedPlan(null);
      toast.success('Payment created! Please complete the transfer.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create payment');
    } finally {
      setCreating(null);
    }
  };

  const handleCancelPayment = async () => {
    if (!activePayment) return;
    
    try {
      await paymentApi.cancelPayment(activePayment.id);
      setActivePayment(null);
      toast.success('Payment cancelled');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel payment');
    }
  };

  const copyCardNumber = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ''));
    toast.success('Card number copied!');
  };

  const copyAmount = (amount: number) => {
    navigator.clipboard.writeText(amount.toFixed(2));
    toast.success('Amount copied!');
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const getPlanIcon = (type: PaymentPlanType) => {
    switch (type) {
      case 'P': return <Zap className="h-6 w-6" />;
      case 'PM': return <Star className="h-6 w-6" />;
      case 'PMD': return <Crown className="h-6 w-6" />;
      default: return <CreditCard className="h-6 w-6" />;
    }
  };

  const getPlanColor = (type: PaymentPlanType) => {
    switch (type) {
      case 'P': return 'from-blue-50 to-blue-100 border-blue-200';
      case 'PM': return 'from-purple-50 to-purple-100 border-purple-200';
      case 'PMD': return 'from-yellow-50 to-orange-100 border-orange-200';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const transactionTypeColors: Record<string, string> = {
    ASSIGNMENT_GENERATION: 'bg-red-100 text-red-800',
    PLAN_UPGRADE: 'bg-green-100 text-green-800',
    ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-800',
    MONTHLY_RESET: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={loadData}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center gap-2">
        <Coins className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
        Token Management
      </h1>

      {/* Current Balance */}
      {balance && (
        <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">
                {balance.planType === 'UNLIMITED' ? (
                  <span className="flex items-center gap-2">
                    <Infinity className="h-8 w-8 md:h-10 md:w-10" /> Unlimited
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
            <div className="sm:text-right">
              <Badge className="text-base md:text-lg px-3 md:px-4 py-1 md:py-2 mb-2">
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

      {/* Active Payment Banner */}
      {activePayment && (
        <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4 w-full">
              <div className="p-2 md:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-yellow-800">Waiting for Payment</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {getTimeRemaining(activePayment.expiresAt)}
                </p>
                
                {/* Payment Details */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Card Number:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 md:px-3 py-1 rounded font-mono text-sm md:text-lg">
                        {CARD_NUMBER}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyCardNumber} className="min-h-[44px] min-w-[44px]">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Pay Exact Amount:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-yellow-200 px-3 md:px-4 py-2 rounded font-mono text-lg md:text-2xl font-bold text-yellow-900">
                        {activePayment.finalAmount.toFixed(2)} UZS
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyAmount(activePayment.finalAmount)} className="min-h-[44px] min-w-[44px]">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                <div className="mt-4 p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs md:text-sm text-red-700 space-y-1">
                      <p className="font-semibold">⚠️ Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Pay the <strong>EXACT</strong> amount including decimals</li>
                        <li>No refunds after payment</li>
                        <li>One payment = one plan activation</li>
                        <li>Manual approval may take up to 12 hours</li>
                        <li>For educational assistance only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleCancelPayment}
              className="text-red-600 hover:bg-red-50 min-h-[44px] w-full md:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Buy Plan Section */}
      {!activePayment && (
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
            Buy Plan
          </h2>
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {paymentPlans.filter(p => !p.isCustom).map(plan => (
              <Card
                key={plan.type}
                className={`p-4 md:p-6 bg-gradient-to-br ${getPlanColor(plan.type)} border-2 hover:shadow-lg transition-all cursor-pointer min-h-[44px]`}
                onClick={() => handleSelectPlan(plan.type)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    plan.type === 'PMD' ? 'bg-orange-200' : 
                    plan.type === 'PM' ? 'bg-purple-200' : 'bg-blue-200'
                  }`}>
                    {getPlanIcon(plan.type)}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{plan.priceFormatted}</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4 md:mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {plan.tokensPerMonth.toLocaleString()} tokens/month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {plan.assignments} assignments
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    Grades: {plan.grades.join(', ')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {plan.durationDays} days validity
                  </li>
                </ul>
                
                <Button className="w-full min-h-[44px]" disabled={!!activePayment}>
                  Select Plan
                </Button>
              </Card>
            ))}
          </div>

          {/* Custom Plan */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
            <h3 className="text-lg md:text-xl font-bold mb-4">Custom Plan</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              Need a specific amount of tokens? Create a custom plan tailored to your needs.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tokens (min 5,000)
                </label>
                <input
                  type="number"
                  min={5000}
                  step={1000}
                  value={customTokens}
                  onChange={(e) => {
                    setCustomTokens(Number(e.target.value));
                    setCustomPrice(null);
                  }}
                  className="w-full px-3 py-2 border rounded-md min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Grade
                </label>
                <select
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value as GradeType)}
                  className="w-full px-3 py-2 border rounded-md min-h-[44px]"
                >
                  <option value="PASS">Pass</option>
                  <option value="MERIT">Merit</option>
                  <option value="DISTINCTION">Distinction</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={calculateCustom} variant="outline" className="w-full min-h-[44px]">
                  Calculate Price
                </Button>
              </div>
            </div>
            
            {customPrice !== null && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-600">Estimated Price</p>
                  <p className="text-xl md:text-2xl font-bold">{customPrice.toLocaleString()} UZS</p>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedPlan('CUSTOM');
                    setShowPaymentModal(true);
                  }}
                  disabled={!!activePayment}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Create Custom Plan
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
            Payment History
          </h2>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map(payment => (
              <Card key={payment.id} className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    payment.status === 'PAID' ? 'bg-green-100' :
                    payment.status === 'WAITING_PAYMENT' ? 'bg-yellow-100' :
                    payment.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {getPlanIcon(payment.planType)}
                  </div>
                  <div>
                    <p className="font-medium">{payment.planType} Plan</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()} • 
                      {payment.finalAmount.toFixed(2)} UZS
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status.replace('_', ' ')}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Token Transaction History */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <History className="h-5 w-5 md:h-6 md:w-6" />
          Token Usage History
        </h2>
        <Card>
          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {!transactions || transactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No transactions yet
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={transactionTypeColors[tx.type] || 'bg-gray-100 text-gray-800'}>
                      {tx.type.replace(/_/g, ' ')}
                    </Badge>
                    <span
                      className={`font-semibold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                        <Badge className={transactionTypeColors[tx.type] || 'bg-gray-100 text-gray-800'}>
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

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Confirm Payment</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Plan
                </label>
                <p className="text-base md:text-lg font-semibold">
                  {selectedPlan === 'CUSTOM' ? 
                    `Custom (${customTokens.toLocaleString()} tokens, ${customGrade})` : 
                    paymentPlans.find(p => p.type === selectedPlan)?.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {(['HUMO', 'UZCARD', 'PAYME'] as PaymentMethod[]).map(method => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method)}
                      className="flex-1 min-h-[44px]"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  By proceeding, you agree that:
                </p>
                <ul className="text-xs md:text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Payments are manual and require admin approval</li>
                  <li>No refunds after payment</li>
                  <li>Exact amount required</li>
                  <li>This is for educational assistance only</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePayment}
                disabled={!!creating}
                className="flex-1 min-h-[44px]"
              >
                {creating ? 'Creating...' : 'Create Payment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
