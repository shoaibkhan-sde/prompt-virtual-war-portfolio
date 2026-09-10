import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook: listens for 'gates_update' socket events for live gate statuses
 * Returns { gates, recommendations, loading, error }
 */
export function useCrowdData() {
  const { token } = useAuth();
  const [gates, setGates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const safetyTimeout = 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), safetyTimeout);

    Promise.all([
      fetch('/api/gates', { headers, signal: controller.signal }),
      fetch('/api/gates/optimal?top_k=10', { headers, signal: controller.signal })
    ])
      .then(async ([gatesRes, optimalRes]) => {
        clearTimeout(timeoutId);
        const gatesJson = await gatesRes.json();
        const optimalJson = await optimalRes.json();
        setGates(gatesJson.gates || []);
        setRecommendations(optimalJson.recommendations || []);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("[useCrowdData] Parallel fetch error or timeout:", err);
        setError(err.name === 'AbortError' ? 'Request timed out' : err.message);
        setLoading(false);
      });

    // Listen for real-time pushed updates
    const handleUpdate = (newData) => {
      setGates(newData.gates || []);
      setRecommendations(newData.optimal || []);
      setLoading(false);
      setError(null);
    };

    socket.on('gates_update', handleUpdate);

    return () => {
      socket.off('gates_update', handleUpdate);
    };
  }, [token]);

  return { gates, recommendations, loading, error };
}
