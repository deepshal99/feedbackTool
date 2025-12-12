'use client';

import { useEffect } from 'react';
import { UrlInput } from '@/components/UrlInput';
import { ProjectList } from '@/components/ProjectList';
import { useProjectsStore } from '@/hooks/useProjectsStore';

export default function Home() {
  const initializeStore = useProjectsStore(state => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Visual Feedback</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Review any website
            </h2>
            <p className="text-muted-foreground max-w-md">
              Add comments and annotations to any website. Switch between device sizes and save your feedback for later.
            </p>
          </div>

          <UrlInput />

          <div className="w-full border-t pt-8">
            <ProjectList />
          </div>
        </div>
      </main>
    </div>
  );
}
