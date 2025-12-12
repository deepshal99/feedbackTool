'use client';

import { useState, useRef, useCallback } from 'react';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';
import { Move } from 'lucide-react';

interface PinsLayerProps {
    comments: Comment[];
    isCommentMode: boolean;
    selectedCommentId: string | null;
    hoveredCommentId: string | null;
    onPinClick: (commentId: string) => void;
    onPinHover: (commentId: string | null) => void;
    onLayerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    containerHeight: number;
    isReadOnly?: boolean;
    onPinMove?: (commentId: string, xPct: number, yPct: number) => void;
    onAreaSelect?: (startX: number, startY: number, endX: number, endY: number) => void;
}

interface DragState {
    isDragging: boolean;
    commentId: string | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
}

interface AreaSelectState {
    isSelecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export function PinsLayer({
    comments,
    isCommentMode,
    selectedCommentId,
    hoveredCommentId,
    onPinClick,
    onPinHover,
    onLayerClick,
    containerHeight,
    isReadOnly = false,
    onPinMove,
    onAreaSelect,
}: PinsLayerProps) {
    const layerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        commentId: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
    });
    const [areaSelect, setAreaSelect] = useState<AreaSelectState>({
        isSelecting: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
    });

    const getPositionFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!layerRef.current) return { xPct: 0, yPct: 0 };
        const rect = layerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = (x / rect.width) * 100;
        const yPct = (y / containerHeight) * 100;
        return { xPct, yPct, x, y };
    }, [containerHeight]);

    // Handle pin drag start
    const handlePinMouseDown = (e: React.MouseEvent, comment: Comment) => {
        if (isReadOnly || !isCommentMode) return;
        e.stopPropagation();
        e.preventDefault();

        const { xPct, yPct } = getPositionFromEvent(e);
        setDragState({
            isDragging: true,
            commentId: comment.id,
            startX: comment.xPct,
            startY: comment.yPct,
            offsetX: xPct - comment.xPct,
            offsetY: yPct - comment.yPct,
        });
    };

    // Handle area selection start
    const handleLayerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isCommentMode || isReadOnly) return;
        if (e.target !== e.currentTarget) return;

        const { xPct, yPct } = getPositionFromEvent(e);
        setAreaSelect({
            isSelecting: true,
            startX: xPct,
            startY: yPct,
            currentX: xPct,
            currentY: yPct,
        });
    };

    // Handle mouse move for both dragging and area selection
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const { xPct, yPct } = getPositionFromEvent(e);

        if (dragState.isDragging && dragState.commentId) {
            // Update pin position visually during drag
            const pin = document.getElementById(`pin-${dragState.commentId}`);
            if (pin) {
                const newX = Math.max(0, Math.min(100, xPct - dragState.offsetX));
                const newY = Math.max(0, Math.min(100, yPct - dragState.offsetY));
                pin.style.left = `${newX}%`;
                pin.style.top = `${newY}%`;
            }
        }

        if (areaSelect.isSelecting) {
            setAreaSelect(prev => ({
                ...prev,
                currentX: xPct,
                currentY: yPct,
            }));
        }
    }, [dragState, areaSelect.isSelecting, getPositionFromEvent]);

    // Handle mouse up
    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const { xPct, yPct } = getPositionFromEvent(e);

        // Finish pin drag
        if (dragState.isDragging && dragState.commentId && onPinMove) {
            const newX = Math.max(0, Math.min(100, xPct - dragState.offsetX));
            const newY = Math.max(0, Math.min(100, yPct - dragState.offsetY));
            onPinMove(dragState.commentId, newX, newY);
        }

        // Finish area selection
        if (areaSelect.isSelecting && onAreaSelect) {
            const width = Math.abs(areaSelect.currentX - areaSelect.startX);
            const height = Math.abs(areaSelect.currentY - areaSelect.startY);

            // Only create area if it's larger than a minimum size (avoid accidental clicks)
            if (width > 1 && height > 1) {
                const minX = Math.min(areaSelect.startX, areaSelect.currentX);
                const minY = Math.min(areaSelect.startY, areaSelect.currentY);
                onAreaSelect(minX, minY, width, height);
            } else {
                // It was a click, not a drag - create pin at this position
                const { xPct, yPct } = getPositionFromEvent(e);
                onLayerClick(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
        }

        setDragState({
            isDragging: false,
            commentId: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
        });
        setAreaSelect({
            isSelecting: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
        });
    }, [dragState, areaSelect, onPinMove, onAreaSelect, onLayerClick, getPositionFromEvent]);

    // Calculate area selection rectangle
    const getAreaRect = () => {
        if (!areaSelect.isSelecting) return null;
        const left = Math.min(areaSelect.startX, areaSelect.currentX);
        const top = Math.min(areaSelect.startY, areaSelect.currentY);
        const width = Math.abs(areaSelect.currentX - areaSelect.startX);
        const height = Math.abs(areaSelect.currentY - areaSelect.startY);
        return { left, top, width, height };
    };

    const areaRect = getAreaRect();

    return (
        <div
            ref={layerRef}
            className={cn(
                'pins-overlay',
                isCommentMode && 'comment-mode'
            )}
            style={{ height: `${containerHeight}px` }}
            onMouseDown={handleLayerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Area selection rectangle */}
            {areaRect && areaRect.width > 0 && (
                <div
                    className="absolute border-2 border-primary bg-primary/20 rounded pointer-events-none"
                    style={{
                        left: `${areaRect.left}%`,
                        top: `${areaRect.top}%`,
                        width: `${areaRect.width}%`,
                        height: `${areaRect.height}%`,
                    }}
                />
            )}

            {/* Render comments (pins and areas) */}
            {comments.map((comment, index) => (
                comment.type === 'area' && comment.widthPct && comment.heightPct ? (
                    // Area comment
                    <div
                        key={comment.id}
                        id={`pin-${comment.id}`}
                        className={cn(
                            'absolute border-2 rounded cursor-pointer transition-all',
                            comment.isResolved
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-primary bg-primary/10',
                            selectedCommentId === comment.id && (comment.isResolved ? 'ring-2 ring-green-500 ring-offset-2 bg-green-500/20' : 'ring-2 ring-ring ring-offset-2 bg-primary/20'),
                            hoveredCommentId === comment.id && (comment.isResolved ? 'bg-green-500/20' : 'bg-primary/20')
                        )}
                        style={{
                            left: `${comment.xPct}%`,
                            top: `${comment.yPct}%`,
                            width: `${comment.widthPct}%`,
                            height: `${comment.heightPct}%`,
                            pointerEvents: 'auto',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPinClick(comment.id);
                        }}
                        onMouseEnter={() => onPinHover(comment.id)}
                        onMouseLeave={() => onPinHover(null)}
                    >
                        <div
                            className={cn(
                                'absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                comment.isResolved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-primary text-primary-foreground'
                            )}
                            onMouseDown={(e) => handlePinMouseDown(e, comment)}
                        >
                            {index + 1}
                        </div>
                    </div>
                ) : (
                    // Pin comment
                    <div
                        key={comment.id}
                        id={`pin-${comment.id}`}
                        className={cn(
                            'pin',
                            comment.isResolved && 'resolved',
                            selectedCommentId === comment.id && 'active',
                            hoveredCommentId === comment.id && 'highlighted',
                            isCommentMode && !isReadOnly && 'cursor-move'
                        )}
                        style={{
                            left: `${comment.xPct}%`,
                            top: `${comment.yPct}%`,
                        }}
                        onClick={(e) => {
                            if (!dragState.isDragging) {
                                e.stopPropagation();
                                onPinClick(comment.id);
                            }
                        }}
                        onMouseDown={(e) => handlePinMouseDown(e, comment)}
                        onMouseEnter={() => onPinHover(comment.id)}
                        onMouseLeave={() => onPinHover(null)}
                    >
                        {index + 1}
                    </div>
                )
            ))}
        </div>
    );
}
