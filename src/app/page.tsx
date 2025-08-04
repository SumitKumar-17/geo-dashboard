'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Slider, Card, Typography, Empty, Button, Flex, Select, InputNumber, ColorPicker, Popconfirm, Collapse, Spin, Skeleton, CollapseProps } from 'antd';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined, SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore, Polygon } from '@/store/useAppStore';
import { getTemperatureForCoord } from '@/services/openMeteoApi';

const { Title, Text } = Typography;

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Spin size="large" /></div>
});

const getPolygonCenter = (latlngs: any[]): [number, number] => {
  if (!latlngs || latlngs.length === 0) return [0, 0];
  const lats = latlngs.map(l => l.lat || l[0]);
  const lngs = latlngs.map(l => l.lng || l[1]);
  return [lats.reduce((a, b) => a + b, 0) / lats.length, lngs.reduce((a, b) => a + b, 0) / lngs.length];
};

const getColorForTemperature = (temp: number, polygon: Polygon): string => {
  const sortedRules = [...polygon.rules].sort((a, b) => {
    if (a.operator.startsWith('>') || a.operator.startsWith('=')) return b.value - a.value;
    return a.value - b.value;
  });
  for (const rule of sortedRules) {
    if ((rule.operator === '<' && temp < rule.value) || (rule.operator === '<=' && temp <= rule.value) || (rule.operator === '>' && temp > rule.value) || (rule.operator === '>=' && temp >= rule.value) || (rule.operator === '=' && temp === rule.value)) {
      return rule.color;
    }
  }
  return '#9ca3af';
};

export default function Home() {
  const polygons = useAppStore((state) => state.polygons);
  const addPolygon = useAppStore((state) => state.addPolygon);
  const timeRange = useAppStore((state) => state.timeRange);
  const { setTimeRange, setPolygonData, setPolygonLoading } = useAppStore();

  const [isClient, setIsClient] = useState(false);
  const today = useMemo(() => dayjs(), []);

  const minDate = today.subtract(30, 'day').unix();
  const maxDate = today.unix();

  useEffect(() => {
    setIsClient(true);
    if (timeRange[0] === 0) {
      setTimeRange([today.subtract(1, 'day').unix(), today.unix()]);
    }
  }, [setTimeRange, today, timeRange]);

  useEffect(() => {
    if (isClient && Object.keys(polygons).length === 0) {
      addPolygon({
        id: 'India',
        latlngs: [
          { lat: 8.0, lng: 68.0 },
          { lat: 37.0, lng: 68.0 },
          { lat: 37.0, lng: 97.0 },
          { lat: 8.0, lng: 97.0 },
        ],
      });
      addPolygon({
        id: 'USA',
        latlngs: [
          { lat: 40.0, lng: -79.0 },
          { lat: 45.0, lng: -79.0 },
          { lat: 45.0, lng: -71.0 },
          { lat: 40.0, lng: -71.0 },
        ],
      });
      addPolygon({
        id: 'Tokyo',
        latlngs: [
          { lat: 32.0, lng: 135.0 },
          { lat: 38.0, lng: 135.0 },
          { lat: 38.0, lng: 142.0 },
          { lat: 32.0, lng: 142.0 },
        ],
      });
      addPolygon({
        id: 'Russia',
        latlngs: [
          { lat: 51.0, lng: 90.0 },
          { lat: 82.0, lng: 90.0 },
          { lat: 82.0, lng: 170.0 },
          { lat: 51.0, lng: 170.0 },
        ],
      });
    }
  }, [isClient, polygons, addPolygon]);
  useEffect(() => {
    if (!isClient) return;

    const startDate = dayjs.unix(timeRange[0]).format('YYYY-MM-DD');
    const endDate = dayjs.unix(timeRange[1]).format('YYYY-MM-DD');

    Object.values(polygons).forEach(async (polygon) => {
      if (!polygon.isLoading) return;
      const [lat, lng] = getPolygonCenter(polygon.latlngs);
      const temp = await getTemperatureForCoord(lat, lng, startDate, endDate);
      const color = temp !== null ? getColorForTemperature(temp, polygon) : '#9ca3af';
      setPolygonData(polygon.id, temp, color);
    });
  }, [polygons, timeRange, setPolygonData, isClient]);

  useEffect(() => {
    if (!isClient) return;
    Object.keys(polygons).forEach(id => setPolygonLoading(id, true));
  }, [timeRange, setPolygonLoading, isClient]);


  if (!isClient) return <Skeleton active />;

  const collapseItems: CollapseProps['items'] = Object.values(polygons).map(p => ({
    key: p.id,
    label: (
      <Title level={5} editable={{ onChange: (newName) => useAppStore.getState().renamePolygon(p.id, newName) }} className="!m-0">
        {p.name}
      </Title>
    ),
    extra: (
      <Popconfirm title="Delete this region?" onConfirm={() => useAppStore.getState().removePolygon(p.id)}>
        <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
      </Popconfirm>
    ),
    children: (
      p.isLoading ? <Spin /> : (
        <>
          <p>Avg. Temperature: <Text strong>{p.fetchedTemp !== null ? `${p.fetchedTemp.toFixed(1)}°C` : 'N/A'}</Text></p>
          <p>Current Color: <span style={{ color: p.color, fontWeight: 'bold', textShadow: '0 0 5px #fff' }}>{p.color}</span></p>
          <Title level={5} className="mt-4">Color Rules</Title>
          {p.rules.map((rule) => (
            <Flex key={rule.id} gap="small" align="center" className="mb-2">
              <ColorPicker value={rule.color} onChange={(c) => useAppStore.getState().updatePolygonRule(p.id, rule.id, { color: c.toHexString() })} size="small" />
              <Select value={rule.operator} onChange={(op) => useAppStore.getState().updatePolygonRule(p.id, rule.id, { operator: op })} options={['<', '<=', '>', '>=', '='].map(op => ({ value: op, label: op }))} style={{ width: '70px' }} />
              <InputNumber value={rule.value} onChange={(val) => useAppStore.getState().updatePolygonRule(p.id, rule.id, { value: val! })} addonAfter="°C" />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => useAppStore.getState().removePolygonRule(p.id, rule.id)} />
            </Flex>
          ))}
          <Button type="dashed" onClick={() => useAppStore.getState().addPolygonRule(p.id)} block icon={<PlusOutlined />}>Add Rule</Button>
        </>
      )
    )
  }));


  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-1/3 max-w-md flex flex-col bg-white shadow-lg">
        <header className="p-4 border-b border-gray-200">
          <Title level={3} className="!mb-0 flex items-center gap-2"><EnvironmentOutlined /> Geo-Weather Dashboard</Title>
          <Text type="secondary">Draw on the map to analyze historical weather data</Text>
        </header>

        <div className="p-4 border-b border-gray-200">
          <Title level={5} className="!mb-2 flex items-center gap-2"><ClockCircleOutlined />Select Time Range</Title>
          <Slider
            range
            min={minDate}
            max={maxDate}
            value={timeRange}
            onChange={(value) => setTimeRange(value as [number, number])}
            tooltip={{ formatter: (value) => value ? dayjs.unix(value).format('MMM D, YYYY') : '' }}
            step={3600 * 24}
          />
          <Flex justify="space-between">
            <Text type="secondary">{dayjs.unix(timeRange[0]).format('MMM D')}</Text>
            <Text type="secondary">{dayjs.unix(timeRange[1]).format('MMM D')}</Text>
          </Flex>
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          <Title level={5} className="!mb-4 flex items-center gap-2"><SettingOutlined />Analysis Regions</Title>
          {collapseItems.length === 0 ? (
            <Empty description="No regions defined. Start by drawing a polygon on the map." />
          ) : (
            <Collapse accordion items={collapseItems} />
          )}
        </div>
      </aside>

      <main className="flex-grow">
        <MapComponent />
      </main>
    </div>
  );
}