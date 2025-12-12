'use client';

import { useState, useRef, useEffect } from 'react';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    Trash2,
    MessageSquare,
    Send,
    MoreVertical,
    Pencil,
    Check,
    X,
    CheckCircle2,
    Square,
    MapPin,
    ShieldCheck
} from 'lucide-react';

interface CommentsSidebarProps {
    comments: Comment[];
    isOpen: boolean;
    onClose: () => void;
    selectedCommentId: string | null;
    hoveredCommentId: string | null;
    onCommentSelect: (commentId: string) => void;
    onCommentHover: (commentId: string | null) => void;
    onCommentUpdate: (commentId: string, text: string) => void;
    onCommentDelete: (commentId: string) => void;
    onToggleResolved?: (commentId: string) => void;
    onToggleResolvedViewer?: (commentId: string) => void;
    onToggleResolvedCommenter?: (commentId: string) => void;
    currentUserRole?: 'viewer' | 'commenter';
    isReadOnly?: boolean;
}

export function CommentsSidebar({
    comments,
    isOpen,
    onClose,
    selectedCommentId,
    hoveredCommentId,
    onCommentSelect,
    onCommentHover,
    onCommentUpdate,
    onCommentDelete,
    onToggleResolved,
    onToggleResolvedViewer,
    onToggleResolvedCommenter,
    currentUserRole = 'commenter',
    isReadOnly = false,
}: CommentsSidebarProps) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

    // Reset editing state when sidebar closes
    useEffect(() => {
        if (!isOpen) {
            setEditingId(null);
            setEditText('');
        }
    }, [isOpen]);

    // Focus textarea when editing starts
    useEffect(() => {
        if (editingId && textareaRefs.current[editingId]) {
            textareaRefs.current[editingId]?.focus();
        }
    }, [editingId]);

    const handleDelete = () => {
        if (deleteConfirmId) {
            onCommentDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const handleStartEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const handleSaveEdit = (commentId: string) => {
        onCommentUpdate(commentId, editText);
        setEditingId(null);
        setEditText('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleSendNewComment = (commentId: string) => {
        const text = newCommentText[commentId]?.trim();
        if (text) {
            onCommentUpdate(commentId, text);
            setNewCommentText(prev => ({ ...prev, [commentId]: '' }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, commentId: string, isEditing: boolean) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isEditing) {
                handleSaveEdit(commentId);
            } else {
                handleSendNewComment(commentId);
            }
        }
        if (e.key === 'Escape' && isEditing) {
            handleCancelEdit();
        }
    };

    const resolvedCount = comments.filter(c => c.resolvedByCommenter).length;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent className="w-[400px] sm:w-[440px] p-0 flex flex-col bg-background">
                    <SheetHeader className="px-5 py-4 border-b bg-muted/30 shrink-0">
                        <SheetTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-primary/10">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-semibold">Comments</span>
                                <span className="text-xs text-muted-foreground font-normal">({comments.length})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-normal">
                                {resolvedCount > 0 && (
                                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {resolvedCount} resolved
                                    </span>
                                )}
                                {isReadOnly && (
                                    <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                        View Only
                                    </span>
                                )}
                            </div>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4">
                        {comments.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                    <MessageSquare className="h-8 w-8 opacity-30" />
                                </div>
                                <p className="font-medium text-foreground">No comments yet</p>
                                {!isReadOnly && (
                                    <p className="text-sm mt-2 max-w-[200px] mx-auto">
                                        Switch to Comment mode and click on the page to add feedback.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((comment, index) => {
                                    const isEditing = editingId === comment.id;
                                    const hasText = comment.text.trim().length > 0;
                                    const isNewComment = !hasText && !isEditing;

                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                "rounded-xl p-4 group transition-all duration-200 border shadow-sm",
                                                currentUserRole === 'commenter' && "cursor-pointer hover:shadow-md",
                                                selectedCommentId === comment.id
                                                    ? "ring-2 ring-primary border-primary bg-primary/5"
                                                    : "border-border bg-card",
                                                currentUserRole === 'commenter' && hoveredCommentId === comment.id && selectedCommentId !== comment.id && "bg-muted/40",
                                                comment.resolvedByCommenter && "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30"
                                            )}
                                            onClick={() => {
                                                if (currentUserRole === 'commenter') {
                                                    onCommentSelect(comment.id);
                                                }
                                            }}
                                            onMouseEnter={() => currentUserRole === 'commenter' && onCommentHover(comment.id)}
                                            onMouseLeave={() => currentUserRole === 'commenter' && onCommentHover(null)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                        comment.resolvedByCommenter
                                                            ? "bg-green-500 text-white"
                                                            : "bg-primary text-primary-foreground"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {comment.deviceMode}
                                                    </span>
                                                </div>

                                                {/* Action Buttons Container */}
                                                <div className="flex items-center gap-2">
                                                    {/* Viewer (Fixed) Toggle - Always visible for viewers */}
                                                    {currentUserRole === 'viewer' && onToggleResolvedViewer && (
                                                        <Button
                                                            variant={comment.resolvedByViewer ? "secondary" : "outline"}
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleResolvedViewer(comment.id);
                                                            }}
                                                            className={cn(
                                                                "h-7 text-xs gap-1.5 px-3 font-medium",
                                                                comment.resolvedByViewer
                                                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                                                                    : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                                            )}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            {comment.resolvedByViewer ? "Fixed" : "Mark Fixed"}
                                                        </Button>
                                                    )}

                                                    {/* Commenter (Resolve) Toggle */}
                                                    {currentUserRole === 'commenter' && onToggleResolvedCommenter && (
                                                        <Button
                                                            variant={comment.resolvedByCommenter ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleResolvedCommenter(comment.id);
                                                            }}
                                                            className={cn(
                                                                "h-7 text-xs gap-1.5 px-3 font-medium transition-colors",
                                                                comment.resolvedByCommenter
                                                                    ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                                                                    : "border-green-500/50 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                                            )}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            {comment.resolvedByCommenter ? "Resolved" : "Resolve"}
                                                        </Button>
                                                    )}

                                                    {/* Edit/Delete Dropdown - Only for commenter */}
                                                    {currentUserRole === 'commenter' && !isReadOnly && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setEditingId(comment.id)}>
                                                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setDeleteConfirmId(comment.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="text-sm">
                                                {editingId === comment.id ? (
                                                    // Edit Mode
                                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                        <Textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="min-h-[60px] text-sm resize-none flex-1"
                                                            autoFocus
                                                        />
                                                        <div className="flex flex-col gap-1">
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveEdit(comment.id);
                                                                }}
                                                            >
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(null);
                                                                }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : isNewComment && currentUserRole === 'commenter' && !isReadOnly ? (
                                                    // New Comment Input
                                                    <div className="flex gap-2">
                                                        <Textarea
                                                            value={newCommentText[comment.id] || ''}
                                                            onChange={(e) => setNewCommentText(prev => ({
                                                                ...prev,
                                                                [comment.id]: e.target.value
                                                            }))}
                                                            onKeyDown={(e) => handleKeyDown(e, comment.id, false)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="Add your comment..."
                                                            className="min-h-[60px] text-sm resize-none flex-1"
                                                        />
                                                        <Button
                                                            size="icon"
                                                            className="shrink-0 self-end"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendNewComment(comment.id);
                                                            }}
                                                            disabled={!newCommentText[comment.id]?.trim()}
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    // Display Mode
                                                    <p className={cn(
                                                        'whitespace-pre-wrap leading-relaxed text-foreground',
                                                        !hasText && 'text-muted-foreground italic',
                                                        comment.resolvedByCommenter && "text-green-800 dark:text-green-200"
                                                    )}>
                                                        {hasText ? comment.text : 'No comment text'}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status Indicators */}
                                            {(comment.resolvedByViewer || comment.resolvedByCommenter) && (
                                                <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap gap-2">
                                                    {comment.resolvedByViewer && !comment.resolvedByCommenter && (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                                                            <Check className="h-3 w-3" />
                                                            Marked as fixed
                                                        </span>
                                                    )}
                                                    {comment.resolvedByCommenter && (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full font-medium">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
