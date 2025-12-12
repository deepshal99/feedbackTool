'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Project, Comment, DeviceMode, CommentType } from '@/types';
import { supabase } from '@/lib/supabase';

interface AddCommentParams {
    type: CommentType;
    xPct: number;
    yPct: number;
    widthPct?: number;
    heightPct?: number;
    deviceMode: DeviceMode;
}

interface ProjectsState {
    projects: Project[];
    initialized: boolean;

    // Actions
    initializeStore: () => Promise<void>;
    addProject: (url: string) => Promise<string>;
    getProject: (id: string) => Project | undefined;
    deleteProject: (id: string) => Promise<void>;
    addComment: (projectId: string, params: AddCommentParams) => Promise<string>;
    updateComment: (projectId: string, commentId: string, text: string) => Promise<void>;
    moveComment: (projectId: string, commentId: string, xPct: number, yPct: number) => Promise<void>;
    toggleResolvedViewer: (projectId: string, commentId: string) => Promise<void>;
    toggleResolvedCommenter: (projectId: string, commentId: string) => Promise<void>;
    deleteComment: (projectId: string, commentId: string) => Promise<void>;
    // Deprecated but kept for type compatibility if needed
    toggleResolved: (projectId: string, commentId: string) => Promise<void>;
}

// Helper to map DB comments to Frontend comments
const mapComment = (c: any): Comment => ({
    id: c.id,
    type: c.type as CommentType,
    xPct: c.x_pct,
    yPct: c.y_pct,
    widthPct: c.width_pct,
    heightPct: c.height_pct,
    text: c.text || '',
    deviceMode: c.device_mode as DeviceMode,
    createdAt: c.created_at,
    isResolved: c.is_resolved, // Keep for backward compat
    resolvedByViewer: c.resolved_by_viewer,
    resolvedByCommenter: c.resolved_by_commenter,
});

export const useProjectsStore = create<ProjectsState>((set, get) => ({
    projects: [],
    initialized: false,

    initializeStore: async () => {
        if (get().initialized) return;

        const fetchProjects = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*, comments(*)');

            if (error) {
                console.error('Failed to load projects:', error);
                return;
            }

            const projects: Project[] = data.map((p: any) => ({
                id: p.id,
                url: p.url,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
                comments: (p.comments || []).map(mapComment),
            }));

            set({ projects, initialized: true });
        };

        await fetchProjects();

        // Real-time subscription
        supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                (payload) => {
                    const state = get();
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    if (eventType === 'INSERT') {
                        const projectId = newRecord.project_id;
                        const newComment = mapComment(newRecord);

                        set({
                            projects: state.projects.map(p => {
                                if (p.id !== projectId) return p;
                                // Avoid duplicate inserts if local optimistic update already added it
                                if (p.comments.some(c => c.id === newComment.id)) return p;
                                return {
                                    ...p,
                                    comments: [...p.comments, newComment],
                                    updatedAt: new Date().toISOString(),
                                };
                            })
                        });
                    } else if (eventType === 'UPDATE') {
                        const projectId = newRecord.project_id;
                        const updatedComment = mapComment(newRecord);

                        set({
                            projects: state.projects.map(p => {
                                if (p.id !== projectId) return p;
                                return {
                                    ...p,
                                    comments: p.comments.map(c =>
                                        c.id === updatedComment.id ? updatedComment : c
                                    ),
                                    updatedAt: new Date().toISOString(),
                                };
                            })
                        });
                    } else if (eventType === 'DELETE') {
                        // We need to find which project had this comment to update nicely,
                        // but easier to just scan all projects since comment IDs are unique
                        set({
                            projects: state.projects.map(p => ({
                                ...p,
                                comments: p.comments.filter(c => c.id !== oldRecord.id)
                            }))
                        });
                    }
                }
            )
            .subscribe();
    },

    addProject: async (url: string) => {
        const existingProject = get().projects.find(p => p.url === url);
        if (existingProject) {
            return existingProject.id;
        }

        const id = uuidv4();
        const newProject: Project = {
            id,
            url,
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set(state => ({ projects: [newProject, ...state.projects] }));

        const { error } = await supabase.from('projects').insert({
            id,
            url,
        });

        if (error) {
            console.error('Failed to create project:', error);
            // Revert on error? For now, we keep it simple.
        }

        return id;
    },

    getProject: (id: string) => {
        return get().projects.find(p => p.id === id);
    },

    deleteProject: async (id: string) => {
        set(state => ({
            projects: state.projects.filter(p => p.id !== id)
        }));

        await supabase.from('projects').delete().eq('id', id);
    },

    addComment: async (projectId: string, params: AddCommentParams) => {
        const commentId = uuidv4();

        const newComment: Comment = {
            id: commentId,
            type: params.type,
            xPct: params.xPct,
            yPct: params.yPct,
            widthPct: params.widthPct,
            heightPct: params.heightPct,
            text: '',
            deviceMode: params.deviceMode,
            createdAt: new Date().toISOString(),
            isResolved: false,
        };

        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: [...project.comments, newComment],
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').insert({
            id: commentId,
            project_id: projectId,
            type: params.type,
            x_pct: params.xPct,
            y_pct: params.yPct,
            width_pct: params.widthPct,
            height_pct: params.heightPct,
            text: '',
            device_mode: params.deviceMode,
            is_resolved: false,
        });

        return commentId;
    },

    updateComment: async (projectId: string, commentId: string, text: string) => {
        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: project.comments.map(comment =>
                        comment.id === commentId ? { ...comment, text } : comment
                    ),
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').update({ text }).eq('id', commentId);
    },

    moveComment: async (projectId: string, commentId: string, xPct: number, yPct: number) => {
        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: project.comments.map(comment =>
                        comment.id === commentId ? { ...comment, xPct, yPct } : comment
                    ),
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').update({ x_pct: xPct, y_pct: yPct }).eq('id', commentId);
    },

    toggleResolvedViewer: async (projectId: string, commentId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        const comment = project?.comments.find(c => c.id === commentId);
        if (!comment) return;

        const newState = !comment.resolvedByViewer;

        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: project.comments.map(c =>
                        c.id === commentId ? { ...c, resolvedByViewer: newState } : c
                    ),
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').update({ resolved_by_viewer: newState }).eq('id', commentId);
    },

    toggleResolvedCommenter: async (projectId: string, commentId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        const comment = project?.comments.find(c => c.id === commentId);
        if (!comment) return;

        const newState = !comment.resolvedByCommenter;

        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: project.comments.map(c =>
                        c.id === commentId ? { ...c, resolvedByCommenter: newState } : c
                    ),
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').update({ resolved_by_commenter: newState }).eq('id', commentId);
    },

    toggleResolved: async (projectId: string, commentId: string) => {
        // Legacy support - maps to viewer resolved for now
        const project = get().projects.find(p => p.id === projectId);
        const comment = project?.comments.find(c => c.id === commentId);
        if (!comment) return;

        const newState = !comment.resolvedByViewer;
        get().toggleResolvedViewer(projectId, commentId);
    },

    deleteComment: async (projectId: string, commentId: string) => {
        set(state => ({
            projects: state.projects.map(project => {
                if (project.id !== projectId) return project;
                return {
                    ...project,
                    comments: project.comments.filter(c => c.id !== commentId),
                    updatedAt: new Date().toISOString(),
                };
            })
        }));

        await supabase.from('comments').delete().eq('id', commentId);
    },
}));


