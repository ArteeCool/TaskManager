export interface User {
    id: number;
    fullname: string;
    email: string;
    avatarurl: string;
    roles: string[];
}

export interface UpdateUserRequest {
    fullname?: string;
    email?: string;
    password?: string;
    avatarurl?: string;
}
