export interface User {
    id: number;
    fullname: string;
    email: string;
    avatarurl: string;
    roles: string[];
    confirmation_key?: string | null;
}

export interface UpdateUserRequest {
    fullname?: string;
    email?: string;
    password?: string;
    avatarurl?: string;
}
