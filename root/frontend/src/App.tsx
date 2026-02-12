import React, {useEffect, useState} from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./Login"
import Register from "./Register";
import OauthCallback from "./OauthCallback";
import Features from "./Features";
import Navbar from "./Navbar.tsx";
import Hero from "./Hero.tsx";
import History from "./History.tsx";
import DbAdmin from "./DbAdmin";
import ProtectedRoute from "./ProtectedRoute";
import Download from "./Download.tsx";
import NewMeasurement from "./NewMeasurement.tsx";
import {api} from "./api.ts";


const App: React.FC = () => {
    interface User {
        email: string;
    }

    const [currentUser, setUser] = useState<User | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.error("No token found");
                setUser(null);
                return;
            }

            try {
                const response = await api.get("/users/me");
                console.log("Token verification response:", response);

                if (response.data && response.data.email) {
                    console.log("Token is valid");
                    setUser({ email: response.data.email });
                } else {
                    console.error("Invalid token response");
                    setUser(null);
                    localStorage.removeItem("access_token");
                }
            } catch (error) {
                console.error("Token verification failed:", error);
                setUser(null);
                localStorage.removeItem("access_token");
            }
        };

        verifyToken();
        console.log("currentUser:", currentUser);
    }, []);


    return (
        <BrowserRouter>
            <div
                className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <Navbar user={currentUser} setUser={setUser}/>
                <Routes>
                    <Route path="/" element={
                        currentUser ? <History currentUser={currentUser}/> :
                            <Hero/>}></Route>
                    <Route path="/register" element={<Register/>}></Route>
                    <Route path="/features" element={<Features/>}></Route>
                    <Route path="/login" element={<Login setUser={setUser} currentUser={currentUser}/>}></Route>
                    <Route path="/oauth/google/callback" element={<OauthCallback/>}></Route>
                    <Route path="/dashboard" element={
                        <ProtectedRoute user={currentUser}>
                            <History currentUser={currentUser}/>
                        </ProtectedRoute>}></Route>
                    <Route path="/download" element={<Download/>}></Route>
                    <Route path="/new" element={<NewMeasurement/>}></Route>
                    <Route path="/history" element={<History currentUser={currentUser}/>}></Route>
                    <Route path="/db-admin" element={<ProtectedRoute user={currentUser}><DbAdmin /></ProtectedRoute>} />

                </Routes>
            </div>
        </BrowserRouter>
    );
};

export default App;
