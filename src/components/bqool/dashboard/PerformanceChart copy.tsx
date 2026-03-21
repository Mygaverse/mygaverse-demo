'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController, // <--- Added
  LineController, // <--- Added
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register all required components AND Controllers
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  BarController,  // <--- Register this
  LineController, // <--- Register this
  Title, 
  Tooltip, 
  Legend
);

interface PerformanceChartProps {
  labels: string[];
  data1: number[];
  data2: number[];
  label1: string;
  label2: string;
}

export const PerformanceChart = ({ labels, data1, data2, label1, label2 }: PerformanceChartProps) => {
  
  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: label1,
        data: data1,
        backgroundColor: '#5e72e4', 
        barThickness: 12, 
        borderRadius: 4,
        order: 2, 
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: label2,
        data: data2,
        borderColor: '#f5365c', 
        backgroundColor: '#f5365c',
        fill: false,
        tension: 0.4, 
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        order: 1, 
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#fff',
        titleColor: '#8898aa',
        bodyColor: '#172b4d',
        borderColor: '#e9ecef',
        borderWidth: 1,
        padding: 10,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8898aa', font: { size: 11 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: '#f5f6f9', tickBorderDash: [5, 5] },
        ticks: { color: '#8898aa', maxTicksLimit: 5 },
        beginAtZero: true 
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { display: false },
        ticks: { color: '#f5365c', maxTicksLimit: 5 },
        beginAtZero: true
      },
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  return (
    <div className="w-full h-full">
      <Chart type='bar' data={chartData} options={options} />
    </div>
  );
};