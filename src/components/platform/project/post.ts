export interface PostProjectState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  }

  export interface PostProjectContextProps {
    postProjectState: PostProjectState;
    postProject: (data: Record<string, unknown>) => Promise<void>;
  }
