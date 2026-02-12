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

        setWaiting(true);

        try {
            const response = await api.post("/measurements/bp", {
                systolic: systolic,
                diastolic: diastolic,
                pulse: pulse,
                timestamp: (date instanceof Date ? date.toISOString() : date)
            });
            if (response.status === 200) {
                console.log("Mittaus tallennettu");
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Request failed:", error);
        } finally {
            setWaiting(false);
        }

    }

    return (
        <div className="relative isolate px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-xl py-16">
                <div className="card bg-white/70 backdrop-blur shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title mb-2">Uusi mittaus</h2>
                        <p className="text-sm text-gray-500 mb-4">Täytä mittauksen arvot ja valitse mittausaika.</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="sys" className="block mb-1 text-sm font-medium text-gray-900">Systolinen verenpaine</label>
                                <input required type="number" max={370} id="sys"
                                       onChange={(e) => setSystolic(parseInt(e.target.value))}
                                       className="input input-bordered w-full" />
                            </div>
                            <div>
                                <label htmlFor="dia" className="block mb-1 text-sm font-medium text-gray-900">Diastolinen verenpaine</label>
                                <input required type="number" max={370} id="dia"
                                       onChange={(e) => setDiastolic(parseInt(e.target.value))}
                                       className="input input-bordered w-full" />
                            </div>
                            <div>
                                <label htmlFor="pulse" className="block mb-1 text-sm font-medium text-gray-900">Syke</label>
                                <input required type="number" max={600} id="pulse"
                                       onChange={(e) => setPulse(parseInt(e.target.value))}
                                       className="input input-bordered w-full" />
                            </div>
                            <div>
                                <label htmlFor="datepicker" className="block mb-1 text-sm font-medium text-gray-900">Mittausaika</label>
                                <DatePicker
                                    className="input input-bordered w-full"
                                    id="datepicker"
                                    selected={date}
                                    onChange={(date) => setDate(date)}
                                    showTimeSelect
                                    dateFormat="Pp"
                                    locale={fi}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={waiting}>
                                {waiting ? 'Tallennetaan…' : 'Tallenna mittaus'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewMeasurement;
