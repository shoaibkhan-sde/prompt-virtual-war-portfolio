/**
 * useMetrics — subscribes to the `metrics_update` WebSocket event.
 * Returns live venue-wide KPI data.
 */
import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';

const DEFAULT_METRICS = {
  alertLevel: 'normal',      // 'normal' | 'elevated' | 'critical'
  criticalZones: 0,
  heavyGates: 0,
  avgWaitSec: 0,
  totalQueuing: 0,
  totalOccupancy: 0,
  totalCapacity: 105000,
  openGates: 7,
  totalGates: 7,
};

export function useMetrics() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {

    const onMetrics = (data) => setMetrics(data);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('metrics_update', onMetrics);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('metrics_update', onMetrics);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { metrics, connected };
}
