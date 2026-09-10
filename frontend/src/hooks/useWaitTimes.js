import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook: listens for 'crowd_update' socket events for live zone wait-time data.
 * Returns { zones, totalOccupancy, totalCapacity, loading, error }
 */
export function useWaitTimes() {
  const { token } = useAuth();
  const [data, setData] = useState({
    zones: [],
    totalOccupancy: 0,
    totalCapacity: 100000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Initial fetch just to populate immediately if socket takes a second
    const safetyTimeout = 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), safetyTimeout);

    fetch('/api/crowd', { headers, signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("[useWaitTimes] Fetch error or timeout:", err);
        setError(err.name === 'AbortError' ? 'Request timed out' : err.message);
        setLoading(false);
      });

    // Listen for real-time pushed updates
    const handleUpdate = (newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    };

    socket.on('crowd_update', handleUpdate);

    return () => {
      socket.off('crowd_update', handleUpdate);
    };
  }, [token]);

  return { ...data, loading, error };
}
