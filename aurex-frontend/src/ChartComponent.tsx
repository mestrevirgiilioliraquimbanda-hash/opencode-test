// Adicionamos a palavra 'type' antes de ISeriesApi
import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export const ChartComponent = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0c0d10' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', 
      downColor: '#ef5350', 
      borderVisible: false,
      wickUpColor: '#26a69a', 
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData([
      { time: '2026-05-01', open: 1.2550, high: 1.2575, low: 1.2540, close: 1.2565 },
      { time: '2026-05-02', open: 1.2565, high: 1.2580, low: 1.2555, close: 1.2570 },
      { time: '2026-05-03', open: 1.2570, high: 1.2595, low: 1.2560, close: 1.2585 },
      { time: '2026-05-04', open: 1.2585, high: 1.2610, low: 1.2580, close: 1.2600 },
      { time: '2026-05-05', open: 1.2600, high: 1.2620, low: 1.2590, close: 1.2615 },
    ]);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};