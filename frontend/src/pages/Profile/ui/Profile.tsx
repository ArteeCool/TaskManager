import { useUser } from "@/features/auth/lib/useUser";
import LocalProfile from "./LocalProfile";
import PublicProfile from "./PublicProfile";
import { useParams } from "react-router";

const Profile = () => {
    const { user } = useUser();
    const userId = useParams();

    return user?.id === Number(userId.id) ? (
        <LocalProfile />
    ) : (
        <PublicProfile id={Number(userId.id)} />
    );
};

export default Profile;
