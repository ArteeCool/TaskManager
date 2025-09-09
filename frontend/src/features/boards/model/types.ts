export interface BoardResponse {
    id: number;
    title: string;
    description: string;
    colorBackground: string;
    colorAccent: string;
    favorite: boolean;
    lastUpdated: string;
    role: "owner" | "admin" | "member";
}
