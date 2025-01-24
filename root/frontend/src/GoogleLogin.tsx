import React from "react";
import {publicApi} from "./api.ts";

const GoogleLogin: React.FC = () => {
    const handleGoogleLogin = async () => {
        try {
            const response = await publicApi.get("/auth/google/authorize");
            if (response.data?.authorization_url) {
                window.open(
                    response.data.authorization_url
                );
            } else {
                console.error("Authorization URL not found in response data");
            }

        } catch (error) {
            console.error("Error fetching Google OAuth URL:", error);
        }
    };

    return (
        <button onClick={handleGoogleLogin}>
            Login with Google
        </button>
    );
};

export default GoogleLogin;