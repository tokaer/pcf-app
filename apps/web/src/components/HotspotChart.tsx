import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function HotspotChart({ items }: { items: { label: string; value: number }[] }) {
  const data = {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: "kg CO₂e",
        data: items.map((i) => i.value),
        backgroundColor: "#10b981",
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false as const },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#e5e7eb" } },
      y: { ticks: { color: "#e5e7eb" } },
    },
  };
  return (
    <div style={{ height: 320 }}>
      <Bar data={data} options={options as any} />
    </div>
  );
}
