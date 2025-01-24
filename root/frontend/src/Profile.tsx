import React, {useEffect, useState} from "react";
import {api} from "./api.ts";

interface ProfileProps {
    token: string;
}

interface UserData {
    message: string;
}

const Profile: React.FC<ProfileProps> = ({token}) => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get("http://localhost:8080/authenticated-route");
                setUserData(response.data);
                console.log("User data received:", response.data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        if (token) {
            fetchUserData();
        }
    }, [token]);

    if (!userData) return <div>Loading...</div>;

    return (
        <div>
            <h1>Welcome, {userData.message}</h1>
        </div>
    );
};

export default Profile;