import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { 
  RefreshCw, BarChart3, TrendingUp, TrendingDown, 
  Users, FileText, Coins, Calendar
} from 'lucide-react';

interface AnalyticsData {
  tokenUsage: {
    total: number;
    byPeriod: { period: string; amount: number }[];
    summary?: {
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
      totalRequests: number;
    };
    byDay?: { date: string; tokens: number; requests: number }[];
    byUser?: { userId: string; email: string; name: string | null; tokens: number }[];
  };
  assignmentStats: {
    total: number;
    byGrade: Record<string, number>;
    byLevel: Record<string, number>;
    byStatus: Record<string, number>;
  };
  userGrowth: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    byRole: Record<string, number>;
  };
  generationStats: {
    avgTime: number;
    successRate: number;
    failureReasons: { reason: string; count: number }[];
  };
}

interface RecapData {
  period: string;
  assignments: {
    total: number;
    byGrade: Record<string, number>;
    byLevel: Record<string, number>;
  };
  users: {
    newRegistrations: number;
    activeUsers: number;
  };
  tokens: {
    consumed: number;
    purchased: number;
  };
}

export function AdminAnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recap, setRecap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenPeriod, setTokenPeriod] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('7d');
  const [recapPeriod, setRecapPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    loadAnalytics();
  }, [tokenPeriod]);

  useEffect(() => {
    loadRecap();
  }, [recapPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, tokenData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getTokenAnalytics(tokenPeriod)
      ]);
      
      // Map token data from backend format to frontend format
      const tokenUsage = {
        total: tokenData.summary?.totalTokens || 0,
        byPeriod: (tokenData.byDay || []).map(d => ({
          period: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: d.tokens
        })),
        summary: tokenData.summary,
        byDay: tokenData.byDay,
        byUser: tokenData.byUser,
      };
      
      setAnalytics({
        tokenUsage,
        assignmentStats: analyticsData.assignments || {},
        userGrowth: analyticsData.users || {},
        generationStats: analyticsData.generation || {}
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecap = async () => {
    try {
      const recapData = await adminApi.getRecap(recapPeriod);
      setRecap(recapData);
    } catch (error) {
      console.error('Failed to load recap:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics Dashboard
        </h2>
        <Button onClick={loadAnalytics} variant="outline" className="border-2 border-black">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Total Users"
          value={analytics?.userGrowth?.total || 0}
          icon={Users}
          change={analytics?.userGrowth?.newThisWeek || 0}
          changeLabel="this week"
        />
        <StatCard 
          label="Total Assignments"
          value={analytics?.assignmentStats?.total || 0}
          icon={FileText}
        />
        <StatCard 
          label="Tokens Used"
          value={analytics?.tokenUsage?.total || 0}
          icon={Coins}
        />
        <StatCard 
          label="Success Rate"
          value={`${((analytics?.generationStats?.successRate || 0) * 100).toFixed(1)}%`}
          icon={TrendingUp}
          highlight={true}
        />
      </div>

      {/* Token Usage Chart */}
      <div className="bg-white border-2 border-black p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Token Usage Over Time</h3>
          <div className="flex border-2 border-black rounded overflow-hidden">
            {([{ value: '24h', label: 'Daily' }, { value: '7d', label: 'Weekly' }, { value: '30d', label: 'Monthly' }, { value: '90d', label: '90 Days' }, { value: '1y', label: 'Yearly' }] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTokenPeriod(value as '24h' | '7d' | '30d' | '90d' | '1y')}
                className={`px-4 py-2 text-sm ${
                  tokenPeriod === value 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {analytics?.tokenUsage?.byPeriod && analytics.tokenUsage.byPeriod.length > 0 ? (
          <div className="h-64">
            <SimpleBarChart data={analytics.tokenUsage.byPeriod} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No token usage data available
          </div>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold text-lg mb-4">Assignments by Grade</h3>
          {analytics?.assignmentStats?.byGrade ? (
            <div className="space-y-3">
              {Object.entries(analytics.assignmentStats.byGrade).map(([grade, count]) => {
                const total = Object.values(analytics.assignmentStats.byGrade).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={grade}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{grade}</span>
                      <span className="font-mono">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          grade === 'Pass' ? 'bg-green-500' :
                          grade === 'Merit' ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Level Distribution */}
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold text-lg mb-4">Assignments by Level</h3>
          {analytics?.assignmentStats?.byLevel ? (
            <div className="space-y-3">
              {Object.entries(analytics.assignmentStats.byLevel).map(([level, count]) => {
                const total = Object.values(analytics.assignmentStats.byLevel).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Level {level}</span>
                      <span className="font-mono">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="font-bold text-lg mb-4">Users by Role</h3>
        {analytics?.userGrowth?.byRole ? (
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(analytics.userGrowth.byRole).map(([role, count]) => (
              <div key={role} className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm text-gray-600">{role}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </div>

      {/* Generation Stats */}
      {analytics?.generationStats && (
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold text-lg mb-4">Generation Performance</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Average Generation Time</p>
              <p className="text-2xl font-bold">
                {analytics.generationStats.avgTime 
                  ? `${Math.round(analytics.generationStats.avgTime / 1000)}s` 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {((analytics.generationStats.successRate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          {analytics.generationStats.failureReasons && analytics.generationStats.failureReasons.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Common Failure Reasons</h4>
              <div className="space-y-2">
                {analytics.generationStats.failureReasons.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.reason}</span>
                    <span className="font-mono">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly/Monthly Recap */}
      <div className="bg-white border-2 border-black p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Period Recap
          </h3>
          <div className="flex border-2 border-black rounded overflow-hidden">
            {([{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRecapPeriod(value as 'weekly' | 'monthly' | 'yearly')}
                className={`px-4 py-2 text-sm ${
                  recapPeriod === value 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {recap ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Assignments</h4>
              <p className="text-3xl font-bold mb-2">{recap.current?.totalAssignments || recap.assignments?.total || 0}</p>
              {(recap.current?.assignmentsByGrade || recap.assignments?.byGrade) && (
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(recap.current?.assignmentsByGrade || recap.assignments?.byGrade || {}).map(([grade, count]) => (
                    <p key={grade}>{grade}: {String(count)}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Users</h4>
              <div className="space-y-2">
                <p><span className="text-gray-600">New:</span> <strong>{recap.current?.newUsers || recap.users?.newRegistrations || 0}</strong></p>
                <p><span className="text-gray-600">Active:</span> <strong>{recap.users?.activeUsers || 0}</strong></p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Tokens</h4>
              <div className="space-y-2">
                <p><span className="text-gray-600">Consumed:</span> <strong>{recap.tokens?.consumed || 0}</strong></p>
                <p><span className="text-gray-600">Purchased:</span> <strong>{recap.tokens?.purchased || 0}</strong></p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No recap data available</p>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  icon: Icon,
  change,
  changeLabel,
  highlight
}: { 
  label: string; 
  value: number | string; 
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border-2 p-6 ${highlight ? 'border-green-500 bg-green-50' : 'border-black bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6 text-gray-400" />
        {change !== undefined && change > 0 && (
          <span className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            +{change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {changeLabel && change !== undefined && (
        <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>
      )}
    </div>
  );
}

function SimpleBarChart({ data }: { data: { period: string; amount: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.amount), 1);
  
  return (
    <div className="h-full flex items-end gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-black rounded-t transition-all hover:bg-gray-700"
            style={{ 
              height: `${(item.amount / maxValue) * 100}%`,
              minHeight: item.amount > 0 ? '4px' : '0'
            }}
            title={`${item.amount} tokens`}
          />
          <p className="text-xs text-gray-500 mt-2 truncate w-full text-center">
            {item.period}
          </p>
        </div>
      ))}
    </div>
  );
}

export default AdminAnalyticsTab;
