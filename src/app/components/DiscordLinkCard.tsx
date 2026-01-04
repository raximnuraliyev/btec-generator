/**
 * Discord Link Component
 * 
 * Allows users to link their Discord account by generating a verification code.
 */

import { useState, useEffect, useCallback } from 'react';
import { discordApi, DiscordStatus } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  Unlink,
  RefreshCw,
  MessageCircle,
  Shield
} from 'lucide-react';

// Discord Bot Invite Link (replace with actual)
const DISCORD_SERVER_LINK = 'https://discord.gg/wjPGhY6X';

export function DiscordLinkCard() {
  const [status, setStatus] = useState<DiscordStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await discordApi.getStatus();
      setStatus(data);
      
      // Calculate countdown if there's an active code
      if (data.activeCode) {
        const expiresAt = new Date(data.activeCode.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(remaining);
      }
    } catch (err) {
      setError('Failed to fetch Discord status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Code expired, refresh status
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchStatus]);

  const generateCode = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const data = await discordApi.generateCode();
      setStatus(prev => prev ? {
        ...prev,
        activeCode: {
          code: data.code,
          expiresAt: data.expiresAt,
        },
      } : null);
      setCountdown(data.expiresIn);
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!status?.activeCode?.code) return;
    
    try {
      await navigator.clipboard.writeText(status.activeCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = status.activeCode.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const unlinkDiscord = async () => {
    if (!confirm('Are you sure you want to unlink your Discord account?')) return;
    
    setUnlinking(true);
    setError(null);

    try {
      await discordApi.unlink();
      setStatus(prev => prev ? {
        ...prev,
        linked: false,
        discordUserId: null,
      } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to unlink Discord');
    } finally {
      setUnlinking(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-[#5865F2]" />
          <CardTitle>Discord Integration</CardTitle>
        </div>
        <CardDescription>
          Link your Discord account to receive notifications about your assignments
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status?.linked ? (
          // Linked State
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Discord Linked
                </span>
              </div>
              <Badge variant="secondary">
                ID: {status.discordUserId?.slice(-6)}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">✓ You will receive DM notifications for:</p>
              <ul className="ml-4 space-y-1">
                <li>• Payment approvals/rejections</li>
                <li>• Assignment completion</li>
                <li>• Token balance warnings</li>
              </ul>
            </div>

            <div className="text-sm space-y-2 p-3 bg-muted rounded-lg">
              <p className="font-medium">📌 Available Bot Commands:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground font-mono">
                <span>!help</span><span>Show all commands</span>
                <span>!profile</span><span>View your profile</span>
                <span>!tokens</span><span>Check token balance</span>
                <span>!assignments</span><span>List your assignments</span>
                <span>!payments</span><span>View payment history</span>
                <span>!support</span><span>Get support info</span>
              </div>
            </div>
          </div>
        ) : status?.activeCode ? (
          // Code Generated State
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your verification code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-mono font-bold tracking-widest">
                  {status.activeCode.code}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={copyCode}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Expires in <span className="font-mono">{formatCountdown(countdown)}</span>
              </p>
            </div>

            <div className="text-sm space-y-2">
              <p className="font-medium">How to link:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Make sure you're in our Discord server</li>
                <li>Use the command <code className="bg-muted px-1 rounded">/link {status.activeCode.code}</code></li>
                <li>The bot will confirm the link</li>
              </ol>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={generateCode}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate New Code
            </Button>
          </div>
        ) : (
          // Not Linked State
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Link your Discord account to:</p>
              <ul className="mt-2 space-y-1">
                <li>• Get real-time progress notifications</li>
                <li>• Receive alerts when assignments complete</li>
                <li>• Use Discord commands to check status</li>
              </ul>
            </div>

            <Button 
              className="w-full bg-[#5865F2] hover:bg-[#4752c4]"
              onClick={generateCode}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Generate Link Code
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {status?.linked ? (
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive"
            onClick={unlinkDiscord}
            disabled={unlinking}
          >
            {unlinking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4 mr-2" />
            )}
            Unlink Discord
          </Button>
        ) : (
          <a 
            href={DISCORD_SERVER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Discord Server
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
