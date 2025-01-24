import {Link} from "react-router-dom";

export default function Hero() {

    return (
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-balance text-6xl font-semibold tracking-tight text-gray-900 sm:text-7xl bg-gradient-to-t from-blue-500 to-blue-800 bg-clip-text text-transparent">
                            Helppo tapa pitää kirjaa verenpaineesta
                        </h1>
                        <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8 ">
                            Hallinnoi ja seuraa verenpainettasi helposti ja turvallisesti. Painepartneri auttaa sinua
                            tallentamaan verenpainemittauksesi kätevästi yhdellä klikkauksella ja
                            mahdollistaa mittaustulosten seuraamisen selkeiden kaavioiden ja tilastojen avulla.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-2">
                            <Link
                                to="/login"
                                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Kirjaudu sisään
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Rekisteröidy
                            </Link>
                        </div>
                    </div>
                </div>
        </div>
    )
}