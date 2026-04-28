import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Truck,
  Fuel,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Static data for demonstration
const STATIC_DATA = {
  overview: {
    totalParcels: 2847,
    parcelGrowth: 12.5,
    totalRevenue: 45680.50,
    revenueGrowth: 8.3,
    activeRiders: 24,
    riderGrowth: 4.2,
    deliveryRate: 94.5,
    deliveryGrowth: 2.1,
    deliveryFees: 18450.00,
    deliveryFeeGrowth: 15.2,
    fuelCosts: 3240.00,
    fuelCostGrowth: -5.3,
    failedDeliveries: 156,
    failedGrowth: -8.1,
    avgDeliveryTime: 2.4,
    avgTimeGrowth: -12.5,
  },
  stations: [
    { id: '1', name: 'Peugeot Station', parcels: 856, revenue: 15240.00, deliveries: 812, failed: 44 },
    { id: '2', name: 'Kumasi Station', parcels: 742, revenue: 13890.50, deliveries: 701, failed: 41 },
    { id: '3', name: 'Takoradi Station', parcels: 623, revenue: 9850.00, deliveries: 590, failed: 33 },
    { id: '4', name: 'Tamale Station', parcels: 426, revenue: 6700.00, deliveries: 402, failed: 24 },
    { id: '5', name: 'Cape Coast Station', parcels: 200, revenue: 3200.00, deliveries: 189, failed: 11 },
  ],
  dailyTrend: [
    { date: 'Mon', parcels: 145, revenue: 2340, deliveries: 138, failed: 7 },
    { date: 'Tue', parcels: 168, revenue: 2680, deliveries: 159, failed: 9 },
    { date: 'Wed', parcels: 192, revenue: 3120, deliveries: 182, failed: 10 },
    { date: 'Thu', parcels: 156, revenue: 2490, deliveries: 148, failed: 8 },
    { date: 'Fri', parcels: 203, revenue: 3280, deliveries: 195, failed: 8 },
    { date: 'Sat', parcels: 178, revenue: 2850, deliveries: 169, failed: 9 },
    { date: 'Sun', parcels: 134, revenue: 2140, deliveries: 127, failed: 7 },
  ],
  parcelTypes: [
    { name: 'POD', value: 1820, percentage: 64 },
    { name: 'Non-POD', value: 1027, percentage: 36 },
  ],
  deliveryMethods: [
    { name: 'Home Delivery', value: 2145, percentage: 75 },
    { name: 'Pickup', value: 702, percentage: 25 },
  ],
  topRiders: [
    { name: 'Kwame Mensah', deliveries: 234, revenue: 3780.00, rating: 4.8 },
    { name: 'Ama Serwaa', deliveries: 218, revenue: 3520.00, rating: 4.9 },
    { name: 'Kofi Asante', deliveries: 201, revenue: 3240.00, rating: 4.7 },
    { name: 'Abena Osei', deliveries: 189, revenue: 3050.00, rating: 4.6 },
    { name: 'Yaw Boateng', deliveries: 176, revenue: 2840.00, rating: 4.8 },
  ],
};

const AdminStatistics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeChart, setActiveChart] = useState<'revenue' | 'deliveries' | 'types'>('revenue');

  const { overview } = STATIC_DATA;

  const COLORS = ['#ea690c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  const statCards = [
    {
      title: 'Total Parcels',
      value: overview.totalParcels.toLocaleString(),
      change: overview.parcelGrowth,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
      value: `GHS ${overview.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: overview.revenueGrowth,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Riders',
      value: overview.activeRiders.toString(),
      change: overview.riderGrowth,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Delivery Rate',
      value: `${overview.deliveryRate}%`,
      change: overview.deliveryGrowth,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Delivery Fees',
      value: `GHS ${overview.deliveryFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: overview.deliveryFeeGrowth,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Fuel Costs',
      value: `GHS ${overview.fuelCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: overview.fuelCostGrowth,
      icon: Fuel,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Failed Deliveries',
      value: overview.failedDeliveries.toString(),
      change: overview.failedGrowth,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Avg Delivery Time',
      value: `${overview.avgDeliveryTime}h`,
      change: overview.avgTimeGrowth,
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">System Statistics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Overall performance across all stations
            </p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-[#ea690c] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isPositive = card.change >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;

            return (
              <Card key={card.title} className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendIcon
                          className={`w-4 h-4 ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {Math.abs(card.change)}%
                        </span>
                        <span className="text-xs text-gray-500">vs last period</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Parcel Trend */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-neutral-800">Revenue & Parcel Trend</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveChart('revenue')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeChart === 'revenue'
                        ? 'bg-[#ea690c] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveChart('deliveries')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeChart === 'deliveries'
                        ? 'bg-[#ea690c] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Deliveries
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {activeChart === 'revenue' ? (
                  <BarChart data={STATIC_DATA.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any) => `GHS ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#ea690c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={STATIC_DATA.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="deliveries"
                      name="Delivered"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Parcel Types & Delivery Methods */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-neutral-800">Distribution Analysis</h2>
                <button
                  onClick={() => setActiveChart(activeChart === 'types' ? 'revenue' : 'types')}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Toggle View
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Parcel Types</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={STATIC_DATA.parcelTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {STATIC_DATA.parcelTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {STATIC_DATA.parcelTypes.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-neutral-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                    Delivery Methods
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={STATIC_DATA.deliveryMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {STATIC_DATA.deliveryMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {STATIC_DATA.deliveryMethods.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index + 2] }}
                          />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-neutral-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Riders Performance */}
        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-neutral-800 mb-4">Top Performing Riders</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#d1d1d1]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Rider Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Deliveries
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_DATA.topRiders.map((rider, index) => (
                    <tr
                      key={rider.name}
                      className={`border-b border-[#d1d1d1] hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                              ? 'bg-gray-100 text-gray-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                        {rider.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                        {rider.deliveries}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        GHS {rider.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-amber-600">★</span>
                          <span className="text-sm font-semibold text-neutral-800">
                            {rider.rating}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Station Performance Table */}
        <Card className="border border-[#d1d1d1] bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-neutral-800 mb-4">Station Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#d1d1d1]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Station
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Parcels
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Delivered
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Failed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_DATA.stations.map((station, index) => {
                    const successRate = ((station.deliveries / station.parcels) * 100).toFixed(1);
                    return (
                      <tr
                        key={station.id}
                        className={`border-b border-[#d1d1d1] hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                          {station.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700">
                          {station.parcels.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          GHS {station.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          {station.deliveries}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          {station.failed}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-neutral-700">
                              {successRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatistics;
