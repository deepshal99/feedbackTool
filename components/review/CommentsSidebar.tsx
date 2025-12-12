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
    MapPin
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

    const resolvedCount = comments.filter(c => c.isResolved).length;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent className="w-[380px] sm:w-[420px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b shrink-0">
                        <SheetTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>Comments ({comments.length})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-normal">
                                {resolvedCount > 0 && (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {resolvedCount} resolved
                                    </span>
                                )}
                                {isReadOnly && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                        View Only
                                    </span>
                                )}
                            </div>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {comments.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No comments yet</p>
                                {!isReadOnly && (
                                    <p className="text-sm mt-1">
                                        Switch to Comment mode and click on the page to add feedback.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {comments.map((comment, index) => {
                                    const isEditing = editingId === comment.id;
                                    const hasText = comment.text.trim().length > 0;
                                    const isNewComment = !hasText && !isEditing;

                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                'p-4 transition-colors cursor-pointer',
                                                selectedCommentId === comment.id && 'bg-muted/50',
                                                hoveredCommentId === comment.id && 'bg-muted/30',
                                                comment.isResolved && 'bg-green-50 dark:bg-green-950/20'
                                            )}
                                            onClick={() => onCommentSelect(comment.id)}
                                            onMouseEnter={() => onCommentHover(comment.id)}
                                            onMouseLeave={() => onCommentHover(null)}
                                        >
                                            {/* Comment Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                                        comment.isResolved
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-primary text-primary-foreground'
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        {comment.type === 'area' ? (
                                                            <Square className="h-3 w-3" />
                                                        ) : (
                                                            <MapPin className="h-3 w-3" />
                                                        )}
                                                        <span className="capitalize">{comment.deviceMode}</span>
                                                        {comment.isResolved && (
                                                            <span className="text-green-600 flex items-center gap-0.5 ml-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Resolved
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions Menu */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreVertical className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {/* Viewer can toggle resolved */}
                                                        {onToggleResolved && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onToggleResolved(comment.id);
                                                                }}
                                                            >
                                                                {comment.isResolved ? (
                                                                    <>
                                                                        <X className="h-4 w-4 mr-2" />
                                                                        Mark as unresolved
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                        Mark as resolved
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {!isReadOnly && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStartEdit(comment);
                                                                    }}
                                                                >
                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteConfirmId(comment.id);
                                                                    }}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="pl-8">
                                                {isEditing ? (
                                                    // Edit Mode
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            ref={(el) => { textareaRefs.current[comment.id] = el; }}
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, comment.id, true)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="Enter your comment..."
                                                            className="min-h-[80px] text-sm resize-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelEdit();
                                                                }}
                                                            >
                                                                <X className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveEdit(comment.id);
                                                                }}
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : isNewComment && !isReadOnly ? (
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
                                                    // Display Comment
                                                    <p className={cn(
                                                        'text-sm whitespace-pre-wrap',
                                                        !hasText && 'text-muted-foreground italic'
                                                    )}>
                                                        {hasText ? comment.text : 'No comment added'}
                                                    </p>
                                                )}
                                            </div>
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
