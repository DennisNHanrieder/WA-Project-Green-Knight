import { useContext } from "react";
import { AuthContext } from "./AuthContext.context";

export function useAuth() {
    return useContext(AuthContext);
}