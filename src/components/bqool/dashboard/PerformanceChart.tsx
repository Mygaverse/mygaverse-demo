'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartType, // Import Type for safety
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  BarController, 
  LineController,
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
  
  // Logic: Determine type as a specific string literal
  // Explicitly typing these variables helps Chart.js understand they are valid chart types
  const type1: 'bar' | 'line' = label1 === 'Impressions' ? 'bar' : 'line';
  const type2: 'bar' | 'line' = label2 === 'Impressions' ? 'bar' : 'line';

  const chartData = {
    labels,
    datasets: [
      {
        type: type1, // FIX: Removed 'as const'
        label: label1,
        data: data1,
        backgroundColor: '#5e72e4', 
        borderColor: '#5e72e4',
        barThickness: 12, 
        borderRadius: 4,
        fill: false,
        tension: 0.4, 
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        order: type1 === 'line' ? 1 : 2, 
        yAxisID: 'y',
      },
      {
        type: type2, // FIX: Removed 'as const'
        label: label2,
        data: data2,
        backgroundColor: '#f5365c',
        borderColor: '#f5365c',
        barThickness: 12, 
        borderRadius: 4,
        fill: false,
        tension: 0.4, 
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        order: type2 === 'line' ? 1 : 2, 
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