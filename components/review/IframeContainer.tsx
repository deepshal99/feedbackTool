'use client';

import { useRef, useState } from 'react';
import { DeviceMode, DEVICE_WIDTHS, Comment } from '@/types';
import { PinsLayer } from './PinsLayer';
import { calculatePercentagePosition } from '@/lib/positionCalculator';
import { AlertCircle } from 'lucide-react';

interface IframeContainerProps {
    url: string;
    deviceMode: DeviceMode;
    comments: Comment[];
    isCommentMode: boolean;
    selectedCommentId: string | null;
    hoveredCommentId: string | null;
    onPinClick: (commentId: string) => void;
    onPinHover: (commentId: string | null) => void;
    onAddPin: (xPct: number, yPct: number) => void;
    onAddArea?: (xPct: number, yPct: number, widthPct: number, heightPct: number) => void;
    onPinMove?: (commentId: string, xPct: number, yPct: number) => void;
    isReadOnly?: boolean;
}

// Large height to show full page content - the outer container handles scrolling
const IFRAME_HEIGHT = 8000;

export function IframeContainer({
    url,
    deviceMode,
    comments,
    isCommentMode,
    selectedCommentId,
    hoveredCommentId,
    onPinClick,
    onPinHover,
    onAddPin,
    onAddArea,
    onPinMove,
    isReadOnly = false,
}: IframeContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [iframeError, setIframeError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const width = DEVICE_WIDTHS[deviceMode];
    const filteredComments = comments.filter(c => c.deviceMode === deviceMode);

    const handleLayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!contentRef.current || !isCommentMode || isReadOnly) return;

        const rect = contentRef.current.getBoundingClientRect();
        const scrollTop = scrollContainerRef.current?.scrollTop || 0;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top + scrollTop;

        // Calculate percentage relative to the full content height
        const { xPct, yPct } = calculatePercentagePosition(
            clickX,
            clickY,
            rect.width,
            IFRAME_HEIGHT
        );

        onAddPin(xPct, yPct);
    };

    const handleAreaSelect = (startX: number, startY: number, width: number, height: number) => {
        if (onAddArea && !isReadOnly) {
            onAddArea(startX, startY, width, height);
        }
    };

    // Handle wheel events on the scroll blocker to scroll the container
    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop += e.deltaY;
            scrollContainerRef.current.scrollLeft += e.deltaX;
        }
    };

    return (
        <div className="flex-1 overflow-hidden p-4 flex justify-center">
            {/* Viewport container */}
            <div
                className="iframe-container relative"
                style={{
                    width: `${width}px`,
                    maxWidth: '100%',
                    height: 'calc(100vh - 180px)',
                }}
            >
                {/* Scrollable container - THIS handles all scrolling */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-auto h-full w-full"
                >
                    {/* Scrollable content area with fixed height */}
                    <div
                        ref={contentRef}
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: `${IFRAME_HEIGHT}px`,
                        }}
                    >
                        {/* Pins Layer - absolute positioned within scrollable content */}
                        <PinsLayer
                            comments={filteredComments}
                            isCommentMode={isCommentMode}
                            selectedCommentId={selectedCommentId}
                            hoveredCommentId={hoveredCommentId}
                            onPinClick={onPinClick}
                            onPinHover={onPinHover}
                            onLayerClick={handleLayerClick}
                            containerHeight={IFRAME_HEIGHT}
                            isReadOnly={isReadOnly}
                            onPinMove={onPinMove}
                            onAreaSelect={handleAreaSelect}
                        />

                        {/* Scroll blocker overlay - intercepts scroll and forwards to container */}
                        <div
                            className="absolute inset-0 z-5"
                            style={{
                                pointerEvents: isCommentMode ? 'none' : 'auto',
                                cursor: 'default',
                            }}
                            onWheel={handleWheel}
                        />

                        {/* Iframe with scrolling disabled */}
                        <iframe
                            src={url}
                            className="w-full border-0 absolute inset-0"
                            style={{
                                height: `${IFRAME_HEIGHT}px`,
                                pointerEvents: 'none',
                            }}
                            scrolling="no"
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setIframeError(true);
                            }}
                            sandbox="allow-same-origin allow-scripts allow-forms"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </div>

                {/* Loading State - overlaid on viewport */}
                {isLoading && !iframeError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-20 pointer-events-none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Loading...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {iframeError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
                        <div className="text-center p-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">Unable to load website</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                This website may block embedding in an iframe.
                                Try opening it directly or use a different URL.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}




