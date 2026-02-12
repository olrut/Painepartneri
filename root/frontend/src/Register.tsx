import React, { useState } from "react";
import OtpForm from "./OtpForm.tsx";
import RegisterForm from "./RegisterForm.tsx";
import { useNavigate } from "react-router-dom";
import { publicApi } from "./api.ts";

const Register = () => {
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  interface User {
    email: string;
    password: string;
  }

  const navigate = useNavigate();

  const sendVerificationEmail = async (addr: string) => {
    try {
      const response = await publicApi.post("/auth/request-verify-token", { email: addr });
      if (response.status === 202) {
        setVerificationSent(true);
        setEmail(addr);
        setError("");
      }
    } catch (e) {
      console.error("Request failed:", e);
    }
  };

  const handleRegister = async (user: User) => {
    try {
      await publicApi.post("/auth/register-json", {
        email: user.email,
        password: user.password,
      });
      // Show OTP form after successful registration
      setVerificationSent(true);
      setEmail(user.email);
      setError("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail === "REGISTER_USER_ALREADY_EXISTS") {
        await sendVerificationEmail(user.email);
      } else if (detail?.code === "REGISTER_INVALID_PASSWORD") {
        setError("Salasana pitää olla vähintään 8 merkkiä pitkä");
      } else {
        console.log(detail);
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
      if (response.data.detail === "OTP_VERIFIED") {
        navigate("/login?verified=1");
      }
    } catch (err: any) {
      if (err?.response?.data?.detail === "Invalid or expired OTP") {
        setError("Virheellinen tai vanhentunut varmennuskoodi");
      }
      console.error("OTP verify failed:", err);
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
        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-sm">
        {verificationSent ? (
          <OtpForm onSubmit={handleOTPSubmit} />
        ) : (
          <RegisterForm handleRegister={handleRegister} />
        )}
      </div>
    </div>
  );
};

export default Register;
