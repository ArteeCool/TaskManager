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
}
