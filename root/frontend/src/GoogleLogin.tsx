import React from "react";

const GoogleLogin: React.FC = () => {
    const handleGoogleLogin = () => {
        // FastAPI Users authorize endpoint issues an HTTP redirect.
        // Navigate the browser directly instead of fetching JSON.
        window.location.href = "/auth/google/authorize";
    };

    return (
        <button onClick={handleGoogleLogin}>
            Login with Google
        </button>
    );
};

export default GoogleLogin;
