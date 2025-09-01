import { createContext } from "react";
import type { User } from "./types";

interface AuthContextType {
    user: User | null;
}

export const AuthContext = createContext<AuthContextType>({
    user: {
        id: 0,
        fullname: "",
        email: "",
        avatarurl: "",
        roles: [],
    },
});
