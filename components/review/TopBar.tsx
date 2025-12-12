'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { DeviceMode, DEVICE_LABELS } from '@/types';
import { ArrowLeft, Monitor, Tablet, Smartphone, MessageSquare, Eye, ChevronDown, Share2 } from 'lucide-react';

interface TopBarProps {
    url: string;
    deviceMode: DeviceMode;
    onDeviceModeChange: (mode: DeviceMode) => void;
    isCommentMode: boolean;
    onCommentModeChange: (enabled: boolean) => void;
    commentsCount: number;
    isSharedView?: boolean;
    onShare?: () => void;
}

const DEVICE_ICONS: Record<DeviceMode, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
};

export function TopBar({
    url,
    deviceMode,
    onDeviceModeChange,
    isCommentMode,
    onCommentModeChange,
    commentsCount,
    isSharedView = false,
    onShare,
}: TopBarProps) {
    const router = useRouter();

    const handleBack = () => {
        router.push('/');
    };

    const truncatedUrl = url.length > 50 ? url.slice(0, 50) + '...' : url;

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground truncate" title={url}>
                            {truncatedUrl}
                        </span>
                        {isSharedView && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                Shared View
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Device Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    {DEVICE_ICONS[deviceMode]}
                                    <span className="hidden sm:inline">{deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {(Object.keys(DEVICE_LABELS) as DeviceMode[]).map((mode) => (
                                    <DropdownMenuItem
                                        key={mode}
                                        onClick={() => onDeviceModeChange(mode)}
                                        className="gap-2"
                                    >
                                        {DEVICE_ICONS[mode]}
                                        {DEVICE_LABELS[mode]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mode Toggle - hidden in shared view */}
                        {!isSharedView && (
                            <div className="flex items-center border rounded-md">
                                <Toggle
                                    pressed={!isCommentMode}
                                    onPressedChange={() => onCommentModeChange(false)}
                                    size="sm"
                                    className="rounded-r-none border-0 data-[state=on]:bg-muted"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">View</span>
                                </Toggle>
                                <Toggle
                                    pressed={isCommentMode}
                                    onPressedChange={() => onCommentModeChange(true)}
                                    size="sm"
                                    className="rounded-l-none border-0 data-[state=on]:bg-muted"
                                >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Comment</span>
                                </Toggle>
                            </div>
                        )}

                        {/* Share button - hidden in shared view */}
                        {!isSharedView && onShare && (
                            <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
                                <Share2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                        )}

                        {/* Comments count badge */}
                        <div className="text-sm text-muted-foreground">
                            {commentsCount} pin{commentsCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

