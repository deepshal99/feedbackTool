export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export type CommentType = 'pin' | 'area';

export interface Comment {
    id: string;
    type: CommentType;
    xPct: number;
    yPct: number;
    // For area selections
    widthPct?: number;
    heightPct?: number;
    text: string;
    deviceMode: DeviceMode;
    createdAt: string;
    isResolved?: boolean; // Deprecated
    resolvedByViewer?: boolean;
    resolvedByCommenter?: boolean;
}

export interface Project {
    id: string;
    url: string;
    comments: Comment[];
    updatedAt: string;
    createdAt: string;
}

export const DEVICE_WIDTHS: Record<DeviceMode, number> = {
    desktop: 1440,
    tablet: 1024,
    mobile: 390,
};

export const DEVICE_LABELS: Record<DeviceMode, string> = {
    desktop: 'Desktop (1440px)',
    tablet: 'Tablet (1024px)',
    mobile: 'Mobile (390px)',
};


