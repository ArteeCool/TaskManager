export interface PasswordData {
    current: string;
    new: string;
    confirm: string;
}

export interface ProfileFormData {
    fullname: string;
    email: string;
    password: PasswordData;
    avatar: File | null;
}
