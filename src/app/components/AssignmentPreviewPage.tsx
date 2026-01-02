import { useEffect, useState } from 'react';
import { generationApi, GenerationContent } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Download, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentPreviewPageProps {
  assignmentId: string;
  onNavigate: (page: 'dashboard' | 'review', assignmentId?: string) => void;
}

export function AssignmentPreviewPage({ assignmentId, onNavigate }: AssignmentPreviewPageProps) {
  const [content, setContent] = useState<GenerationContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockedSections, setUnlockedSections] = useState<Set<string>>(new Set(['introduction']));

  useEffect(() => {
    loadContent();
  }, [assignmentId]);

  const loadContent = async () => {

    try {
      setLoading(true);
      const data = await generationApi.getContent(assignmentId);
      setContent(data);
    } catch (err: any) {
      console.error('[PREVIEW] Failed to load content:', err);
      toast.error(err.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Navigate to review page which has download functionality
    onNavigate('review', assignmentId);
  };

  const handleUnlockAll = () => {
    if (!content) return;
    const allSections = content.blocks.map((b) => b.blockType);
    setUnlockedSections(new Set(allSections));
    toast.success('All sections unlocked! You can now download the full assignment.');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="p-12 text-center">
          <p className="text-lg text-gray-600">Assignment not found</p>
          <Button onClick={() => onNavigate('dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const allUnlocked = content.blocks.every((b) => unlockedSections.has(b.blockType));

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Assignment Preview</h1>
            <p className="text-sm text-gray-600">
              Generated on {new Date(content.generatedAt).toLocaleString()}
            </p>
          </div>
          <Badge className="text-lg px-4 py-2">
            {content.totalTokensUsed.toLocaleString()} tokens
          </Badge>
        </div>

        <div className="flex gap-2">
          {!allUnlocked ? (
            <Button onClick={handleUnlockAll} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Unlock Full Preview
            </Button>
          ) : (
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Assignment
            </Button>
          )}
        </div>
      </Card>

      {/* Content Blocks */}
      <div className="space-y-6">
        {content.blocks
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((block) => {
            const isLocked = !unlockedSections.has(block.blockType);
            const isIntroduction = block.blockType === 'introduction';

            return (
              <Card
                key={block.id}
                className={`p-6 relative ${isLocked ? 'border-orange-300' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold capitalize">
                      {block.blockType.replace(/_/g, ' ')}
                    </h2>
                    {isLocked && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{block.tokensUsed} tokens</Badge>
                </div>

                <div
                  className={`prose prose-sm max-w-none ${
                    isLocked ? 'filter blur-md select-none pointer-events-none' : ''
                  }`}
                >
                  {block.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 flex items-end justify-center pb-6">
                    <Button
                      variant="outline"
                      className="bg-white shadow-lg"
                      onClick={() => {
                        const newUnlocked = new Set(unlockedSections);
                        newUnlocked.add(block.blockType);
                        setUnlockedSections(newUnlocked);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Unlock This Section
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* Summary Card */}
      <Card className="p-6 mt-6 bg-gray-50">
        <h3 className="font-bold mb-3">Generation Summary</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Blocks</p>
            <p className="text-2xl font-bold">{content.blocks.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Unlocked</p>
            <p className="text-2xl font-bold">
              {unlockedSections.size} / {content.blocks.length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Tokens</p>
            <p className="text-2xl font-bold">{content.totalTokensUsed.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
