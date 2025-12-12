export interface PercentagePosition {
    xPct: number;
    yPct: number;
}

export function calculatePercentagePosition(
    clickX: number,
    clickY: number,
    containerWidth: number,
    containerHeight: number
): PercentagePosition {
    const xPct = (clickX / containerWidth) * 100;
    const yPct = (clickY / containerHeight) * 100;

    return {
        xPct: Math.max(0, Math.min(100, xPct)),
        yPct: Math.max(0, Math.min(100, yPct)),
    };
}

export function getPixelPosition(
    xPct: number,
    yPct: number,
    containerWidth: number,
    containerHeight: number
): { x: number; y: number } {
    return {
        x: (xPct / 100) * containerWidth,
        y: (yPct / 100) * containerHeight,
    };
}
