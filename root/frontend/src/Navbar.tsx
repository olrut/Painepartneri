import {useState} from "react";
import {Dialog, DialogPanel} from '@headlessui/react'
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline'
import {Link} from "react-router-dom";
import {api} from "./api.ts";

export default function Navbar({user, setUser}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    let navigationLeft = []
    let navigationRight = []

    if (!user) {
        navigationLeft = [
            {name: 'Ominaisuudet', href: '/features'},
            {name: 'Lataa sovellus', href: '/download'},
            {name: 'FAQ', href: '#'},
        ]
        navigationRight = [
            {name: 'Rekisteröidy', href: '/register'},
            {name: 'Kirjaudu sisään', href: '/login'},
        ]
    } else {
        navigationLeft = [
            {name: 'Uusi mittaus', href: '/new'},
            {name: 'Mittaushistoria', href: '/history'},
            {name: 'Kalenteri', href: '/calendar'},
            {name: 'Profiili', href: '/profile'},
        ]
    }

    /*
        * Logout the user and remove the JWT token from local storage
     */
    const handleLogout = async () => {
        setUser(null);
        try {
            await api.post("/auth/jwt/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        }
        localStorage.removeItem("access_token");
    }


    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <Link to="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Painepartneri</span>
                        <img
                            alt="Painepartneri"
                            src="logo-no-background.svg"
                            className="h-8 w-auto"
                        />
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6"/>
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {navigationLeft.map((item) => (
                        <Link to={item.href} key={item.name} className="text-sm/6 font-semibold text-gray-900">
                            {item.name}
                        </Link>
                    ))}
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-5">
                    {navigationRight.map((item) => (
                        <Link to={item.href} key={item.name} className="text-sm/6 font-semibold text-gray-900">
                            {item.name}
                        </Link>
                    ))}
                    {user && (
                        <button onClick={handleLogout} className="text-base/7 font-semibold text-gray-900">
                            Kirjaudu ulos
                        </button>
                    )}
                </div>
            </nav>

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50"/>
                <DialogPanel
                    className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <Link to={"/"} className="-m-1.5 p-1.5">
                            <span className="sr-only">Painepartneri</span>
                            <img
                                alt="Painepartneri"
                                src="logo-no-background.svg"
                                className="h-8 w-auto"
                            />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6"/>
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                {navigationLeft.map((item) => (
                                    <p>
                                        <Link to={item.href} key={item.name}
                                              className="text-base/7 font-semibold text-gray-900">
                                            {item.name}
                                        </Link>
                                    </p>
                                ))}
                            </div>
                            <div className="py-6">
                                {navigationRight.map((item) => (
                                    <Link to={item.href} key={item.name}
                                          className="text-base/7 font-semibold text-gray-900">
                                        {item.name}
                                    </Link>
                                ))}
                                {user && (
                                    <button onClick={handleLogout}
                                            className="text-base/7 font-semibold text-gray-900">
                                        Kirjaudu ulos
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
