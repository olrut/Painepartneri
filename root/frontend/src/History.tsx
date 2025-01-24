import React, {useEffect, useState} from "react";

import LineChart from "./LineChart";
import {api} from "./api.ts";

const History: React.FC = ({currentUser}) => {

    const [measurements, setMeasurements] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [sortConfig, setSortConfig] = useState({key: "date", order: "asc"});

    const tableHeaders = [
        {key: "date", label: "Mittausaika"},
        {key: "systolic", label: "Yläpaine"},
        {key: "diastolic", label: "Alapaine"},
        {key: "pulse", label: "Pulssi"},
    ];


    useEffect(() => {
        getMeasurements();
    }, []);


    const getMeasurements = async () => {
        try {
            const response = await api.get("/measurements/bp");
            response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const measurements = response.data;
            measurements.forEach((measurement) => {
                measurement.date = new Date(measurement.timestamp).toLocaleString('fi-FI', {
                    dateStyle: "short",
                    timeStyle: "short"
                });
            });
            setMeasurements(response.data);

        } catch (error) {
            console.error("Request failed:", error);
        }
    }

    const handleMeasurementsSort = (key) => {
        setSortConfig((prevState) => {
            // Toggle the order if the same column is clicked
            const newOrder = prevState.key === key && prevState.order === "asc" ? "desc" : "asc";
            return {key, order: newOrder};
        });
    };

    const sortedMeasurements = [...measurements].sort((a, b) => {
        if (sortConfig.order === "asc") {
            return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        }
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

    return (
        <div className="relative isolate px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                <div className="text-left">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 mb-5">
                            Viimeiset verenpainemittauksesi:
                        </h1>
                        <div className="overflow-x-auto font">
                            <table className="table text-black font-medium">
                                <thead className="text-blue-500 text-base">
                                <tr>
                                    <th></th>
                                    {tableHeaders.map((header) => (
                                        <th key={header.key} onClick={() => handleMeasurementsSort(header.key)}>
                                            {header.label} {sortConfig.key === header.key ? (sortConfig.order === "asc" ? "↑" : "↓") : ""}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>

                                {sortedMeasurements.map((measurement) => (
                                    <tr key={measurement.id} className="hover:font-bold">
                                        <th>
                                            <label>
                                                <input type="checkbox" className="checkbox"/>
                                            </label>
                                        </th>
                                        <td>{measurement.date}</td>
                                        <td>{measurement.systolic}</td>
                                        <td>{measurement.diastolic}</td>
                                        <td>{measurement.pulse}</td>
                                        <th>
                                            <button className="btn btn-ghost btn-xs">Lisätietoja</button>
                                        </th>
                                    </tr>
                                ))}

                                <button className="btn btn-ghost btn-md">Poista</button>

                                </tbody>
                                <tfoot className="text-blue-500 text-base">
                                <tr>
                                    <th></th>
                                    <th>Mittausaika</th>
                                    <th>Yläpaine</th>
                                    <th>Alapaine</th>
                                    <th>Pulssi</th>
                                    <th></th>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <div className="h-96">
                        <LineChart data={measurements}/>
                    </div>
                </div>
            </div>
            <div className="mx-auto max-w-2xl py-10 sm:py-14 lg:py-1">
                asd
            </div>
        </div>
    );
}

export default History;