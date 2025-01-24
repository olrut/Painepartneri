import React, {useState} from "react";
import Datepicker from "react-tailwindcss-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import fi from 'date-fns/locale/fi';
import DatePicker from "react-datepicker";
import {api} from "./api.ts";
import {useNavigate} from "react-router-dom";

const NewMeasurement: React.FC = () => {

    const [date, setDate] = useState(new Date());
    const [systolic, setSystolic] = useState<number>(0);
    const [diastolic, setDiastolic] = useState<number>(0);
    const [pulse, setPulse] = useState<number>(0);
    const [waiting, setWaiting] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleDateChange = (date: string) => {
        setDate(date);
    }

    const [value, setValue] = useState({
        startDate: null,
        endDate: null
    });

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const response = await api.post("http://localhost:8080/measurements/bp", {
                systolic: systolic,
                diastolic: diastolic,
                pulse: pulse,
                timestamp: date
            });
            if (response.status === 200) {
                console.log("Mittaus tallennettu");
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Request failed:", error);
        }

    }

    return (
        <div className="relative isolate px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                <div className="text-left">
                    <div className="mb-6">
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="large-input"
                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Systolinen
                                verenpaine</label>
                            <input required="true" type="number" max="370" id="large-input"
                                   onChange={(e) => setSystolic(parseInt(e.target.value))}
                                   className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                            </input>
                            <label htmlFor="large-input"
                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Diastolinen
                                verenpaine</label>
                            <input required="true" type="number" max="370" id="large-input"
                                   onChange={(e) => setDiastolic(parseInt(e.target.value))}
                                   className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                            </input>
                            <label htmlFor="large-input"
                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Syke</label>
                            <input required="true" type="number" max="600" id="large-input"
                                   onChange={(e) => setPulse(parseInt(e.target.value))}
                                   className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                            </input>
                            <label htmlFor="datepicker"
                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Mittausaika</label>

                            <DatePicker
                                className="block w-full p-4 mb-6 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                id="datepicker"
                                selected={date}
                                onChange={(date) => setDate(date)}
                                showTimeSelect
                                dateFormat="Pp"
                                locale={fi}
                            />
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600 py-3.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                disabled>

                                Tallennetaan...
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewMeasurement;