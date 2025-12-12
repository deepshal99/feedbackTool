'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjectsStore } from '@/hooks/useProjectsStore';
import { TopBar } from '@/components/review/TopBar';
import { IframeContainer } from '@/components/review/IframeContainer';
import { CommentsSidebar } from '@/components/review/CommentsSidebar';
import { DeviceMode, Comment, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { MessageSquare, Share2, Check, Copy } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ReviewPageProps {
    params: Promise<{ id: string }>;
}

// Encode project data for sharing
function encodeProjectData(project: Project): string {
    const data = {
        url: project.url,
        comments: project.comments.map(c => ({
            id: c.id,
            type: c.type || 'pin',
            xPct: c.xPct,
            yPct: c.yPct,
            widthPct: c.widthPct,
            heightPct: c.heightPct,
            text: c.text,
            deviceMode: c.deviceMode,
            isResolved: c.isResolved || false,
        })),
    };
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

// Decode shared project data
function decodeProjectData(encoded: string): { url: string; comments: Comment[] } | null {
    try {
        const json = decodeURIComponent(atob(encoded));
        const data = JSON.parse(json);
        return {
            url: data.url,
            comments: data.comments.map((c: any) => ({
                ...c,
                type: c.type || 'pin',
                isResolved: c.isResolved || false,
                createdAt: new Date().toISOString(),
            })),
        };
    } catch {
        return null;
    }
}

export default function ReviewPage({ params }: ReviewPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const initializeStore = useProjectsStore(state => state.initializeStore);
    const getProject = useProjectsStore(state => state.getProject);
    const addComment = useProjectsStore(state => state.addComment);
    const updateComment = useProjectsStore(state => state.updateComment);
    const moveComment = useProjectsStore(state => state.moveComment);
    const toggleResolved = useProjectsStore(state => state.toggleResolved);
    const deleteComment = useProjectsStore(state => state.deleteComment);
    const initialized = useProjectsStore(state => state.initialized);

    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [isCommentMode, setIsCommentMode] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
    const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    // Local state for shared view comments (allows resolved toggling without store)
    const [sharedComments, setSharedComments] = useState<Comment[]>([]);

    // Check if viewing shared data
    const sharedData = searchParams.get('shared');
    const sharedProject = useMemo(() => {
        if (sharedData) {
            return decodeProjectData(sharedData);
        }
        return null;
    }, [sharedData]);

    const isSharedView = !!sharedProject;

    // Initialize shared comments from decoded data
    useEffect(() => {
        if (sharedProject && sharedComments.length === 0) {
            setSharedComments(sharedProject.comments);
        }
    }, [sharedProject, sharedComments.length]);

    useEffect(() => {
        if (!isSharedView) {
            initializeStore();
        }
    }, [initializeStore, isSharedView]);

    const project = isSharedView
        ? { id: 'shared', url: sharedProject!.url, comments: sharedComments.length > 0 ? sharedComments : sharedProject!.comments, createdAt: '', updatedAt: '' }
        : (initialized ? getProject(id) : null);

    useEffect(() => {
        if (!isSharedView && initialized && !project) {
            router.push('/');
        }
    }, [initialized, project, router, isSharedView]);

    if (!isSharedView && !initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading...
                </div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    const handleAddPin = (xPct: number, yPct: number) => {
        if (isSharedView) return;
        const commentId = addComment(id, {
            type: 'pin',
            xPct,
            yPct,
            deviceMode,
        });
        setSelectedCommentId(commentId);
        setIsSidebarOpen(true);
    };

    const handleAddArea = (xPct: number, yPct: number, widthPct: number, heightPct: number) => {
        if (isSharedView) return;
        const commentId = addComment(id, {
            type: 'area',
            xPct,
            yPct,
            widthPct,
            heightPct,
            deviceMode,
        });
        setSelectedCommentId(commentId);
        setIsSidebarOpen(true);
    };

    const handlePinMove = (commentId: string, xPct: number, yPct: number) => {
        if (isSharedView) return;
        moveComment(id, commentId, xPct, yPct);
    };

    const handlePinClick = (commentId: string) => {
        setSelectedCommentId(commentId);
        setIsSidebarOpen(true);
    };

    const handleCommentUpdate = (commentId: string, text: string) => {
        if (isSharedView) return;
        updateComment(id, commentId, text);
    };

    const handleCommentDelete = (commentId: string) => {
        if (isSharedView) return;
        deleteComment(id, commentId);
        if (selectedCommentId === commentId) {
            setSelectedCommentId(null);
        }
    };

    const handleToggleResolved = (commentId: string) => {
        if (isSharedView) {
            // For shared view, update local state
            setSharedComments(prev =>
                prev.map(c =>
                    c.id === commentId ? { ...c, isResolved: !c.isResolved } : c
                )
            );
        } else {
            toggleResolved(id, commentId);
        }
    };

    const handleShare = () => {
        setIsShareDialogOpen(true);
        setCopied(false);
    };

    const getShareUrl = () => {
        if (typeof window === 'undefined') return '';
        const encoded = encodeProjectData(project as Project);
        return `${window.location.origin}/review/shared?shared=${encoded}`;
    };

    const handleCopyLink = async () => {
        const url = getShareUrl();
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredComments = project.comments.filter(c => c.deviceMode === deviceMode);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopBar
                url={project.url}
                deviceMode={deviceMode}
                onDeviceModeChange={setDeviceMode}
                isCommentMode={isCommentMode}
                onCommentModeChange={isSharedView ? () => { } : setIsCommentMode}
                commentsCount={project.comments.length}
                isSharedView={isSharedView}
                onShare={handleShare}
            />

            <div className="flex-1 flex">
                <IframeContainer
                    url={project.url}
                    deviceMode={deviceMode}
                    comments={project.comments}
                    isCommentMode={isCommentMode && !isSharedView}
                    selectedCommentId={selectedCommentId}
                    hoveredCommentId={hoveredCommentId}
                    onPinClick={handlePinClick}
                    onPinHover={setHoveredCommentId}
                    onAddPin={handleAddPin}
                    onAddArea={handleAddArea}
                    onPinMove={handlePinMove}
                    isReadOnly={isSharedView}
                />

                {/* Sidebar Toggle Button */}
                <div className="fixed bottom-4 right-4 z-40">
                    <Button
                        size="lg"
                        className="rounded-full shadow-lg gap-2"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <MessageSquare className="h-4 w-4" />
                        {filteredComments.length}
                    </Button>
                </div>
            </div>

            <CommentsSidebar
                comments={filteredComments}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                selectedCommentId={selectedCommentId}
                hoveredCommentId={hoveredCommentId}
                onCommentSelect={setSelectedCommentId}
                onCommentHover={setHoveredCommentId}
                onCommentUpdate={handleCommentUpdate}
                onCommentDelete={handleCommentDelete}
                onToggleResolved={handleToggleResolved}
                isReadOnly={isSharedView}
            />

            {/* Share Dialog */}
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            Share Review
                        </DialogTitle>
                        <DialogDescription>
                            Anyone with this link can view the webpage with your comments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Input
                            value={getShareUrl()}
                            readOnly
                            className="text-sm"
                        />
                        <Button onClick={handleCopyLink} variant="outline" size="icon">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

