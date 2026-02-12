import React, {useEffect, useState} from "react";

import LineChart from "./LineChart";
import {api} from "./api.ts";

interface Measurement {
    id: string;
    userId: string;
    systolic: number;
    diastolic: number;
    pulse: number;
    timestamp: string;
    date?: string;
}

const History: React.FC = ({currentUser}) => {

    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{key: keyof Measurement | 'date'; order: 'asc' | 'desc'}>({key: "date", order: "asc"});

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

    const toggleSelected = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(id); else next.delete(id);
            return next;
        });
    };

    const deleteSelected = async () => {
        if (selectedIds.size === 0) return;
        try {
            await Promise.all(
                Array.from(selectedIds).map(id => api.delete(`/measurements/bp/${id}`))
            );
            setSelectedIds(new Set());
            await getMeasurements();
        } catch (e) {
            console.error("Delete failed:", e);
        }
    }

    return (
        <div className="relative isolate px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-4xl py-16">
                <div className="text-left">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 mb-5">
                            Viimeiset verenpainemittauksesi
                        </h1>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">Valittuja: {selectedIds.size}</p>
                            <button onClick={deleteSelected} disabled={selectedIds.size === 0}
                                    className="btn btn-error btn-sm disabled:btn-disabled">
                                Poista valitut
                            </button>
                        </div>
                        <div className="card bg-white/70 backdrop-blur shadow-xl">
                            <div className="card-body p-0">
                            <div className="overflow-x-auto font rounded-box">
                                <table className="table table-zebra text-black font-medium">
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

                                {sortedMeasurements.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            Ei vielä mittauksia. Lisää ensimmäinen mittaus sivulla "Uusi mittaus".
                                        </td>
                                    </tr>
                                )}

                                {sortedMeasurements.map((measurement) => (
                                    <tr key={measurement.id} className="hover:font-bold">
                                        <th>
                                            <label>
                                                <input type="checkbox" className="checkbox"
                                                       checked={selectedIds.has(measurement.id)}
                                                       onChange={(e) => toggleSelected(measurement.id, e.target.checked)}
                                                />
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
                        </div>
                    </div>
                    {measurements.length > 0 && (
                        <div className="h-96 card bg-white/70 backdrop-blur shadow-xl p-4">
                            <LineChart data={measurements}/>
                        </div>
                    )}
                </div>
            </div>
            <div className="mx-auto max-w-2xl py-10 sm:py-14 lg:py-1" />
        </div>
    );
}

export default History;
