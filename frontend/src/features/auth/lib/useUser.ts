import { useContext } from "react";
import { AuthContext } from "../model/context";

export const useUser = () => {
    return useContext(AuthContext);
};
