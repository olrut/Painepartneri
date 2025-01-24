import {
    Card,
    CardBody,
    CardHeader,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";


export default function LineChart({data}) {
    const timeAndpulse = data.map((item) => ({x: new Date(item.timestamp), y: item.pulse}));
    const timeAndSystolic = data.map((item) => ({x: new Date(item.timestamp), y: item.systolic}));
    const timeAndDiastolic = data.map((item) => ({x: new Date(item.timestamp), y: item.diastolic}));
    console.log(data);

    const chartConfig = {
        type: "line",
        zoom: {
            autoScaleYaxis: true,
        },
        series: [
            {
                name: "Diastolinen (alapaine)",
                data: timeAndpulse,
            },
            {
                name: "Systolinen (yläpaine)",
                data: timeAndSystolic,
            },
            {
                name: "Pulssi",
                data: timeAndDiastolic,
            }
        ],
        options: {
            chart: {
                toolbar: {
                    show: true,
                },
            },
            dataLabels: {
                enabled: false,
            },
            colors: ["#34D399", "#F87171", "#BE185D"],
            stroke: {
                lineCap: "round",
                curve: "smooth",
            },
            markers: {
                size: 0,
                style: 'hollow',
            },
            xaxis: {
                type: "datetime",
                axisTicks: {
                    show: false,
                },
                axisBorder: {
                    show: false,
                },
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
            },
            grid: {
                show: true,
                borderColor: "#dddddd",
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                padding: {
                    top: 5,
                    right: 20,
                },
            },
            fill: {
                opacity: 0.8,
            },
            tooltip: {
                x: {
                    format: 'dd MMM yyyy'
                },
                theme: "dark",
            },
        },
    };

    return (
        <Card>
            <CardHeader
                color="transparent"
                className="flex flex-col gap-4 rounded-none md:flex-row md:items-center"
            >
            </CardHeader>
            <CardBody className="px-2 pb-0">
                <Chart {...chartConfig} />
            </CardBody>
        </Card>
    );
}