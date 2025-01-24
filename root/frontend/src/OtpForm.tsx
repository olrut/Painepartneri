import React, { useState, useRef } from 'react';
import {Link} from "react-router-dom";

const OtpForm = ({onSubmit}) => {
    const [otp, setOtp] = useState(Array(4).fill(''));
    const inputsRef = useRef([]);

    const handleInput = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (!otp[index] && index > 0) {
                inputsRef.current[index - 1].focus();
            } else {
                handleInput('', index);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{4}$/.test(pasteData)) {
            const digits = pasteData.split('');
            setOtp(digits);
            inputsRef.current[digits.length - 1].focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        onSubmit(otpValue);
    }


    return (
        <div className="max-w-md mx-auto text-center bg-white px-4 sm:px-8 py-10 rounded-xl shadow">
            <header className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Sähköpostivarmistus</h1>
                <p className="text-[15px] text-slate-500">
                    Anna nelinumeroinen varmistuskoodi, joka lähetettiin sähköpostiisi:
                </p>
            </header>
            <form id="otp-form" onSubmit={handleSubmit}>
                <div className="flex items-center justify-center gap-3">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            value={digit}
                            onChange={(e) =>
                                handleInput(e.target.value.replace(/[^0-9]/g, ''), index)
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onFocus={(e) => e.target.select()}
                            onPaste={handlePaste}
                            className="w-14 h-14 text-center text-2xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            maxLength="1"
                        />
                    ))}
                </div>
                <div className="max-w-[260px] mx-auto mt-4">
                    <button
                        type="submit"
                        className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 transition-colors duration-150"
                    >
                        Verify Account
                    </button>
                </div>
            </form>
            <div className="text-sm text-slate-500 mt-4">
                Etkö saanut koodia?{' '}
                <Link to="/register" onClick={() => window.location.reload()} className="font-medium text-indigo-500 hover:text-indigo-600">
                    Yritä uudelleen
                </Link>
            </div>
        </div>
    );
};

export default OtpForm;