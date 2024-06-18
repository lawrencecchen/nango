export interface AsanaTask {
    created_at: string | null;
    modified_at: string | null;
    gid: string;
    resource_type: string;
    name: string;
    completed: boolean;
    due_date: string | null;
    tags: string[];
    start_on: string | null;
    due_at: string | null;
    due_on: string | null;
    completed_at: string | null;
    actual_time_minutes: number;
    assignee: AsanaUser | null;
    start_at: string | null;
    num_hearts: number;
    num_likes: number;
    workspace: string;
    hearted: boolean;
    hearts: string[];
    liked: boolean;
    likes: string[];
    notes: string;
    assignee_status: string;
    followers: string[];
    parent: string | null;
    permalink_url: string;
}
export interface AsanaUser {
    gid: string;
    name: string;
    email: string;
}
export interface CreateAsanaTask {
    name: string;
    workspace: string;
    projects?: string[];
    parent?: string;
    due_date?: string;
    assignee?: AsanaUser;
    notes?: string;
    tags?: string[];
}
