import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import {publicApi} from "./api.ts";
const OauthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Tarkista URL:stä authorization code ja state
    useEffect(() => {
        const handleAuthCode = async () => {
            const queryParams = new URLSearchParams(location.search);
            const state = queryParams.get("state");
            const code = queryParams.get("code");

            if (code && state) {
                console.log("Authorization code received:", code);
                await handleGoogleCallback(code, state);
            } else {
                console.error("Authorization code or state is missing");
            }
        };

        handleAuthCode();
    }, [location]);

    // Käsittele Google OAuth -palautus ja vaihda koodi tokeniksi
    const handleGoogleCallback = async (code: string, state: string) => {
        const address = `/auth/google/callback?code=${code}&state=${state}`;
        try {
            const response = await publicApi.get(address);
            console.log("Response received:", response);

            // Tallennetaan JWT token localStorageen
            if (response.data.access_token) {
                localStorage.setItem("access_token", response.data.access_token);
                navigate("/");
            } else {
                console.error("Access token not found in response");
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div>
            <h1>Logging in...</h1>
        </div>
    );
};

export default OauthCallback;