export interface BoardRequest {
    title: string;
    description: string;
    colorBackground: string;
    colorAccent: string;
}

export interface BoardResponse {
    id: number;
    title: string;
    description: string;
    color_background: string;
    color_accent: string;
    favorite: boolean;
    last_updated: string;
    role: "owner" | "admin" | "member";
    member_count: number;
    tasks_count: number;
}

export interface Task {
    id: number;
    list_id: number;
    title: string;
    description: string;
    position: number;
    created_at?: string;
    board_id?: number;
    assignees?: Member[];
    comments?: Comment[];
}

export interface TaskRequest {
    id: number;
    title?: string;
    list_id?: number;
    position?: number;
    assignees?: number[];
}

export interface Member {
    id: number;
    fullname: string;
    avatarurl: string;
    email: string;
}

export interface Comment {
    id: number;
    task_id: number;
    author: Member;
    content: string;
    created_at: string;
}

export interface ListWithTasks {
    id: number;
    board_id: number;
    title: string;
    position: number;
    tasks: Task[];
}

export interface BoardWithListsResponse {
    board: BoardResponse;
    lists: ListWithTasks[];
    members: Member[];
}

export interface ListRequest {
    title: string;
    position?: number;
    id: number;
}
