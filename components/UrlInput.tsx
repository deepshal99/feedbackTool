'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProjectsStore } from '@/hooks/useProjectsStore';

function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

export function UrlInput() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const addProject = useProjectsStore(state => state.addProject);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const normalizedUrl = normalizeUrl(url.trim());

        if (!isValidUrl(normalizedUrl)) {
            setError('Please enter a valid URL');
            return;
        }

        const projectId = addProject(normalizedUrl);
        router.push(`/review/${projectId}`);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
            <div className="flex gap-3">
                <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to review (e.g., example.com)"
                    className="flex-1 h-12 text-base"
                />
                <Button type="submit" size="lg" className="px-8">
                    Review
                </Button>
            </div>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </form>
    );
}
