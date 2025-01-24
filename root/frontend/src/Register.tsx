import React, {useState} from "react";
import OtpForm from "./OtpForm.tsx";
import RegisterForm from "./RegisterForm.tsx";
import {Navigate, useNavigate} from "react-router-dom";
import {publicApi, api} from "./api.ts";

const Register = ({setToken}) => {

        const [verificationSent, setVerificationSent] = useState<boolean>(false);
        const [email, setEmail] = useState<string>("");
        const [error, setError] = useState<string>("");

        interface User {
            email: string;
            password: string;
        }

        const navigate = useNavigate();
        const requestVerifyToken = async (email: string) => {
            try {
                const response = await publicApi.post("/auth/request-verify-token", {
                    email: email,
                });
                console.log(response);
                return response.status;
            } catch (error) {
                console.error("Request failed:", error);
            }
        }

        const sendVerificationEmail = async (email: string,) => {
            try {
                const response = await publicApi.post("/auth/request-verify-token", {
                    email: email,
                });
                console.log(response);
                if (response.status === 202) {
                    setVerificationSent(true);
                    setEmail(email);
                    setError("");
                }
            } catch (error) {
                console.error("Request failed:", error);
            }
        };


        const handleRegister = async (user: User) => {
            try {
                await publicApi.post("/auth/register", {
                    email: user.email,
                    password: user.password,
                });

            } catch (error) {
                if (error.response.data.detail === "REGISTER_USER_ALREADY_EXISTS") {
                    await sendVerificationEmail(user.email);

                } else if (error.response.data.detail.code === "REGISTER_INVALID_PASSWORD") {
                    setError("Salasana pitää olla vähintään 8 merkkiä pitkä");
                } else {
                    console.log(error.response.data.detail);
                    setError("Rekisteröinti epäonnistui");
                }
            }
        };

        const handleOTPSubmit = async (otp: string) => {
            try {
                const response = await publicApi.post("/auth/verify-otp", {
                    email: email,
                    otp: otp,
                });

                console.log(response);
                if (response.data.detail === "OTP_VERIFIED") {
                    setToken(response.data.access_token);
                    navigate("/login");
                }

            } catch (error) {
                if (error.response.data.detail === "Invalid or expired OTP") {
                    setError("Virheellinen tai vanhentunut varmennuskoodi");
                }
                console.error("Login failed:", error);
            }
        };

        return (
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h1 className="text-center text-3xl font-bold tracking-tight text-gray-800">
                        Rekisteröidy käyttäjäksi
                    </h1>
                </div>

                {error && (
                    <div
                        className="mt-12 sm:mx-auto sm:w-full sm:max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                        role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-sm">
                    {verificationSent ? (
                        <OtpForm onSubmit={handleOTPSubmit}/>
                    ) : (
                        <RegisterForm handleRegister={handleRegister}/>
                    )}
                </div>
            </div>
        );
    }
;


export default Register;
