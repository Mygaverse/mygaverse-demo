export interface MetricType {
  id: string;
  title: string;
  value: string;
  previousValue: string;
  change: string;
  isPositive: boolean;
}

export const AVAILABLE_METRICS: MetricType[] = [
  { id: 'total-sales', title: 'Total Sales', value: '$29,876.54', previousValue: '$48,765.43', change: '12.23%', isPositive: false },
  { id: 'ad-sales', title: 'Ad Sales', value: '$1,256.78', previousValue: '$365.43', change: '243.96%', isPositive: true },
  { id: 'ad-spend', title: 'Ad Spend', value: '$856.78', previousValue: '$756.21', change: '13.30%', isPositive: true },
  { id: 'acos', title: 'ACOS', value: '23.45%', previousValue: '24.15%', change: '2.90%', isPositive: true },
  { id: 'total-acos', title: 'Total ACOS', value: '75.45%', previousValue: '80.34%', change: '12.23%', isPositive: true },
  { id: 'roas', title: 'ROAS', value: '26.43', previousValue: '31.43', change: '12.23%', isPositive: false },
  { id: 'ad-orders', title: 'Ad Orders', value: '678', previousValue: '567', change: '12.23%', isPositive: true },
  { id: 'ad-units-sold', title: 'Ad Units Sold', value: '1,234', previousValue: '1,123', change: '9.88%', isPositive: true },
  { id: 'cvr', title: 'CVR', value: '8.54%', previousValue: '7.21%', change: '18.45%', isPositive: true },
  { id: 'impressions', title: 'Impressions', value: '45,678', previousValue: '38,432', change: '18.86%', isPositive: true },
  { id: 'clicks', title: 'Clicks', value: '3,456', previousValue: '2,987', change: '15.71%', isPositive: true },
  { id: 'ctr', title: 'CTR', value: '7.57%', previousValue: '7.77%', change: '2.57%', isPositive: false },
  { id: 'cpc', title: 'CPC', value: '$0.25', previousValue: '$0.25', change: '0.00%', isPositive: true },
];