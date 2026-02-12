import React, {useState} from "react";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {publicApi} from "./api.ts";

interface LoginProps {
    setUser: (user: { email: string; token: string }) => void;
    currentUser: { email: string } | null;
}

const Login: React.FC<LoginProps> = ({setUser, currentUser}) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const navigate = useNavigate();
    React.useEffect(() => {
        if (currentUser) {
            navigate("/dashboard");
        }
    }, [currentUser, navigate]);
    const location = useLocation();
    const verified = new URLSearchParams(location.search).get("verified") === "1";

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await publicApi.post('/auth/login', { email, password });
            localStorage.setItem("access_token", response.data.access_token);
            const user = { email, token: response.data.access_token };
            setUser(user);
            navigate("/dashboard");
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'USER_NOT_FOUND') {
                setError('Käyttäjää ei löydy');
            } else if (detail === 'USER_INACTIVE') {
                setError('Käyttäjätili on passivoitu');
            } else if (detail === 'USER_NOT_VERIFIED') {
                setError('Sähköpostia ei ole vahvistettu');
            } else if (detail === 'INVALID_PASSWORD') {
                setError('Virheellinen salasana');
            } else {
                setError('Kirjautuminen epäonnistui');
            }
        }
    }

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h1 className="text-center text-3xl font-bold tracking-tight text-gray-800">
                    Kirjaudu sisään
                </h1>
            </div>

            {verified && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-5" role="alert">
                    <p>Tilisi on vahvistettu. Kirjaudu sisään.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-5" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                            Sähköpostiosoite
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                                Salasana
                            </label>
                            <div className="text-sm">
                                <Link to={"/forgot-password"}
                                      className="font-semibold text-indigo-600 hover:text-indigo-500">
                                    Unohtuiko salasana?
                                </Link>
                            </div>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Kirjaudu sisään
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-500">
                    Ei tunnuksia?{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Rekisteröidy tästä
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
