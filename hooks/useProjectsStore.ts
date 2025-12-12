'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Project, Comment, DeviceMode, CommentType } from '@/types';
import { loadProjects, saveProjects } from '@/lib/storage';

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
    initializeStore: () => void;
    addProject: (url: string) => string;
    getProject: (id: string) => Project | undefined;
    deleteProject: (id: string) => void;
    addComment: (projectId: string, params: AddCommentParams) => string;
    updateComment: (projectId: string, commentId: string, text: string) => void;
    moveComment: (projectId: string, commentId: string, xPct: number, yPct: number) => void;
    toggleResolved: (projectId: string, commentId: string) => void;
    deleteComment: (projectId: string, commentId: string) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
    projects: [],
    initialized: false,

    initializeStore: () => {
        if (get().initialized) return;
        const projects = loadProjects();
        set({ projects, initialized: true });
    },

    addProject: (url: string) => {
        const existingProject = get().projects.find(p => p.url === url);
        if (existingProject) {
            return existingProject.id;
        }

        const newProject: Project = {
            id: uuidv4(),
            url,
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        set(state => {
            const newProjects = [newProject, ...state.projects];
            saveProjects(newProjects);
            return { projects: newProjects };
        });

        return newProject.id;
    },

    getProject: (id: string) => {
        return get().projects.find(p => p.id === id);
    },

    deleteProject: (id: string) => {
        set(state => {
            const newProjects = state.projects.filter(p => p.id !== id);
            saveProjects(newProjects);
            return { projects: newProjects };
        });
    },

    addComment: (projectId: string, params: AddCommentParams) => {
        const commentId = uuidv4();

        set(state => {
            const newProjects = state.projects.map(project => {
                if (project.id !== projectId) return project;

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

                return {
                    ...project,
                    comments: [...project.comments, newComment],
                    updatedAt: new Date().toISOString(),
                };
            });

            saveProjects(newProjects);
            return { projects: newProjects };
        });

        return commentId;
    },

    updateComment: (projectId: string, commentId: string, text: string) => {
        set(state => {
            const newProjects = state.projects.map(project => {
                if (project.id !== projectId) return project;

                return {
                    ...project,
                    comments: project.comments.map(comment =>
                        comment.id === commentId ? { ...comment, text } : comment
                    ),
                    updatedAt: new Date().toISOString(),
                };
            });

            saveProjects(newProjects);
            return { projects: newProjects };
        });
    },

    moveComment: (projectId: string, commentId: string, xPct: number, yPct: number) => {
        set(state => {
            const newProjects = state.projects.map(project => {
                if (project.id !== projectId) return project;

                return {
                    ...project,
                    comments: project.comments.map(comment =>
                        comment.id === commentId ? { ...comment, xPct, yPct } : comment
                    ),
                    updatedAt: new Date().toISOString(),
                };
            });

            saveProjects(newProjects);
            return { projects: newProjects };
        });
    },

    toggleResolved: (projectId: string, commentId: string) => {
        set(state => {
            const newProjects = state.projects.map(project => {
                if (project.id !== projectId) return project;

                return {
                    ...project,
                    comments: project.comments.map(comment =>
                        comment.id === commentId
                            ? { ...comment, isResolved: !comment.isResolved }
                            : comment
                    ),
                    updatedAt: new Date().toISOString(),
                };
            });

            saveProjects(newProjects);
            return { projects: newProjects };
        });
    },

    deleteComment: (projectId: string, commentId: string) => {
        set(state => {
            const newProjects = state.projects.map(project => {
                if (project.id !== projectId) return project;

                return {
                    ...project,
                    comments: project.comments.filter(c => c.id !== commentId),
                    updatedAt: new Date().toISOString(),
                };
            });

            saveProjects(newProjects);
            return { projects: newProjects };
        });
    },
}));


