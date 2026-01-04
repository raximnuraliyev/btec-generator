// =============================================================================
// BTEC GENERATOR - ADMIN PAYMENTS TAB
// =============================================================================
// Admin interface for managing payments.
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { 
  paymentApi, 
  PaymentTransaction, 
  PaymentStats, 
  PaymentStatus 
} from '../../services/api';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Search, 
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

const CARD_NUMBER = '9680 3501 4687 8359';

export function AdminPaymentsTab() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchAmount, setSearchAmount] = useState('');
  const [foundPayment, setFoundPayment] = useState<PaymentTransaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('WAITING_PAYMENT');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, statsRes] = await Promise.all([
        statusFilter === 'WAITING_PAYMENT' 
          ? paymentApi.getPendingPayments()
          : paymentApi.getAllPayments(1, 100, statusFilter === 'ALL' ? undefined : statusFilter),
        paymentApi.getPaymentStats(),
      ]);
      setPayments(paymentsRes.payments);
      setStats(statsRes);
    } catch (err) {
      console.error('[ADMIN_PAYMENTS] Failed to load data:', err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async () => {
    const amount = parseFloat(searchAmount);
    if (isNaN(amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const res = await paymentApi.findPaymentByAmount(amount);
      setFoundPayment(res.payment);
      toast.success('Payment found!');
    } catch (err: any) {
      setFoundPayment(null);
      toast.error(err.message || 'Payment not found');
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      await paymentApi.approvePayment(paymentId);
      toast.success('Payment approved and plan activated!');
      setFoundPayment(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(paymentId);
      await paymentApi.rejectPayment(paymentId, rejectReason);
      toast.success('Payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleExpireOld = async () => {
    try {
      const res = await paymentApi.expireOldPayments();
      toast.success(res.message);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to expire payments');
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'WAITING_PAYMENT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PAID': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading && !payments.length) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          <Card className="p-3 md:p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 md:gap-3">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-yellow-700">{stats.pendingPayments}</p>
                <p className="text-xs md:text-sm text-yellow-600">Pending</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 md:gap-3">
              <Check className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-green-700">{stats.approvedPayments}</p>
                <p className="text-xs md:text-sm text-green-600">Approved</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 md:gap-3">
              <X className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-red-700">{stats.rejectedPayments}</p>
                <p className="text-xs md:text-sm text-red-600">Rejected</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-2 md:gap-3">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-gray-600 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-700">{stats.expiredPayments}</p>
                <p className="text-xs md:text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 bg-blue-50 border-blue-200 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 md:gap-3">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-blue-700">
                  {(stats.totalRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs md:text-sm text-blue-600">Revenue (UZS)</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Card Number Reference */}
      <Card className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">Payment Card</p>
              <code className="text-base md:text-lg font-mono font-bold">{CARD_NUMBER}</code>
            </div>
          </div>
          <div className="text-xs md:text-sm text-gray-500 sm:text-right">
            Check your bank app (HUMO/Click/Payme) for incoming transfers
          </div>
        </div>
      </Card>

      {/* Search by Amount */}
      <Card className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find Payment by Amount
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            placeholder="Enter exact amount (e.g., 50000.37)"
            className="flex-1 px-4 py-2 min-h-[44px] border rounded-lg text-base"
          />
          <Button onClick={handleSearch} className="min-h-[44px]">
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>

        {/* Found Payment */}
        {foundPayment && (
          <div className="mt-4 p-3 md:p-4 bg-green-50 rounded-lg border-2 border-green-300">
            <h4 className="font-semibold text-green-800 mb-2">✅ Payment Found!</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600">User</p>
                <p className="font-medium text-sm md:text-base truncate">{foundPayment.user?.email}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Plan</p>
                <p className="font-medium text-sm md:text-base">{foundPayment.planType}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Amount</p>
                <p className="font-medium text-sm md:text-base">{formatAmount(foundPayment.finalAmount)} UZS</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Time Left</p>
                <p className="font-medium text-sm md:text-base">{getTimeRemaining(foundPayment.expiresAt)}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => handleApprove(foundPayment.id)}
                disabled={processing === foundPayment.id}
                className="bg-green-600 hover:bg-green-700 min-h-[44px]"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Activate Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(foundPayment.id);
                }}
                className="text-red-600 border-red-300 hover:bg-red-50 min-h-[44px]"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
            className="px-3 py-2 min-h-[44px] border rounded-lg flex-1 sm:flex-none text-base"
          >
            <option value="ALL">All Payments</option>
            <option value="WAITING_PAYMENT">Pending</option>
            <option value="PAID">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExpireOld} className="min-h-[44px] flex-1 sm:flex-none">
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Expire Old</span>
          </Button>
          <Button variant="outline" onClick={loadData} className="min-h-[44px] flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {payments.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No payments found
          </Card>
        ) : (
          payments.map(payment => (
            <Card key={payment.id} className="p-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{payment.user?.email}</p>
                  <p className="text-sm text-gray-500">{payment.user?.name || 'N/A'}</p>
                </div>
                <Badge className={`${getStatusColor(payment.status)} border text-xs flex-shrink-0`}>
                  {payment.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Plan:</span>
                  <p className="font-medium">{payment.planType}</p>
                  {payment.customTokens && (
                    <p className="text-xs text-gray-500">{payment.customTokens.toLocaleString()} tokens</p>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-mono font-bold">{formatAmount(payment.finalAmount)}</p>
                  <p className="text-xs text-gray-500">UZS</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p>{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                {payment.status === 'WAITING_PAYMENT' && (
                  <div>
                    <span className="text-gray-500">Time Left:</span>
                    <p className={new Date(payment.expiresAt) < new Date() ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                      {getTimeRemaining(payment.expiresAt)}
                    </p>
                  </div>
                )}
              </div>

              {payment.status === 'WAITING_PAYMENT' && (
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    onClick={() => handleApprove(payment.id)}
                    disabled={processing === payment.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 min-h-[44px]"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(payment.id)}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 min-h-[44px]"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
              {payment.status === 'PAID' && payment.approvedAt && (
                <p className="text-xs text-green-600 pt-2 border-t">
                  Approved {new Date(payment.approvedAt).toLocaleDateString()}
                </p>
              )}
              {payment.status === 'REJECTED' && payment.rejectionReason && (
                <p className="text-xs text-red-600 pt-2 border-t truncate">
                  Reason: {payment.rejectionReason}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Plan</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Time Left</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{payment.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{payment.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{payment.planType}</p>
                        {payment.customTokens && (
                          <p className="text-sm text-gray-500">
                            {payment.customTokens.toLocaleString()} tokens
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-mono font-bold">{formatAmount(payment.finalAmount)}</p>
                      <p className="text-sm text-gray-500">UZS</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${getStatusColor(payment.status)} border`}>
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.status === 'WAITING_PAYMENT' ? (
                        <span className={`text-sm ${
                          new Date(payment.expiresAt) < new Date() 
                            ? 'text-red-600 font-bold' 
                            : 'text-yellow-600'
                        }`}>
                          {getTimeRemaining(payment.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.status === 'WAITING_PAYMENT' && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(payment.id)}
                            disabled={processing === payment.id}
                            className="bg-green-600 hover:bg-green-700 min-h-[44px] min-w-[44px]"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowRejectModal(payment.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {payment.status === 'PAID' && payment.approvedAt && (
                        <p className="text-xs text-green-600">
                          Approved {new Date(payment.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                      {payment.status === 'REJECTED' && (
                        <p className="text-xs text-red-600" title={payment.rejectionReason || ''}>
                          {payment.rejectionReason?.substring(0, 20)}...
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <Card className="w-full sm:max-w-md p-4 sm:p-6 rounded-t-xl sm:rounded-xl">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
              Reject Payment
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-3 py-2 border rounded-lg min-h-[100px] text-base"
                rows={3}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 min-h-[44px] order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim() || processing === showRejectModal}
                className="flex-1 bg-red-600 hover:bg-red-700 min-h-[44px] order-1 sm:order-2"
              >
                {processing === showRejectModal ? 'Rejecting...' : 'Reject Payment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
