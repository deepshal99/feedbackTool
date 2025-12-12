'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useProjectsStore } from '@/hooks/useProjectsStore';
import { Project } from '@/types';
import { Trash2, ExternalLink, MessageSquare } from 'lucide-react';

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncateUrl(url: string, maxLength: number = 50): string {
    try {
        const parsed = new URL(url);
        const display = parsed.hostname + parsed.pathname;
        if (display.length > maxLength) {
            return display.slice(0, maxLength) + '...';
        }
        return display;
    } catch {
        return url.slice(0, maxLength);
    }
}

function ProjectCard({ project }: { project: Project }) {
    const router = useRouter();
    const deleteProject = useProjectsStore(state => state.deleteProject);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = () => {
        router.push(`/review/${project.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteProject(project.id);
        setIsDeleting(false);
    };

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
            onClick={handleClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium truncate flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {truncateUrl(project.url)}
                    </CardTitle>
                    <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                                <DialogTitle>Delete Project</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this project? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleting(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDelete}>
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{project.comments.length} comment{project.comments.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span>{formatDate(project.updatedAt)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProjectList() {
    const projects = useProjectsStore(state => state.projects);

    if (projects.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>No projects yet. Enter a URL above to get started.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl">
            <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
}
