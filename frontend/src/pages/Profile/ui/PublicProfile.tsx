import { usePublicProfile } from "@/features/profile/model/usePublicProfile";

interface PublicProfileProps {
    id: number;
}

const PublicProfile = ({ id }: PublicProfileProps) => {
    const { data } = usePublicProfile(id);
    const user = data?.data ?? { fullname: "", avatarurl: "" };

    return (
        <>
            {user && (
                <div className="flex-1 bg-background flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="bg-card border border-border rounded-lg p-8 text-center">
                            <div className="mb-6">
                                <div className="w-24 h-24 mx-auto">
                                    {user.avatarurl && (
                                        <img
                                            src={user.avatarurl}
                                            alt={user.fullname}
                                            className="w-full h-full rounded- object-cover border border-border"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Name & Username */}
                            <div className="space-y-2">
                                {user.fullname && (
                                    <h1 className="text-2xl font-semibold text-foreground">
                                        {user.fullname}
                                    </h1>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PublicProfile;
