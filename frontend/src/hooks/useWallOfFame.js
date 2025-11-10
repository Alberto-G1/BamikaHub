import { useEffect, useState, useRef } from 'react';
import api from '../api/api';

// Hook contract:
// returns { awards, current, loading, error, activeAward, hasAwards, setCurrent, refetch }
// Rotation pauses when awards.length < 2 or when `paused` option is true
// Backwards compatible: accept number or options object
// refreshIntervalMs: auto-refresh awards from server (default: 5 minutes)
export default function useWallOfFame(optionsOrMs = 7000) {
  const opts = typeof optionsOrMs === 'number' ? { rotationIntervalMs: optionsOrMs } : (optionsOrMs || {});
  const { rotationIntervalMs = 7000, paused = false, refreshIntervalMs = 300000 } = opts; // 5 min default
  const [awards, setAwards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchAwards = async () => {
    try {
      const res = await api.get('/motivation/wall-of-fame');
      setAwards(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load wall of fame');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAwards();
  }, []);

  // Auto-refresh awards periodically
  useEffect(() => {
    if (!refreshIntervalMs) return;
    
    refreshTimerRef.current = setInterval(() => {
      fetchAwards();
    }, refreshIntervalMs);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refreshIntervalMs]);

  // Rotation timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (awards.length < 2 || paused) return; // no rotation needed or paused
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % awards.length);
    }, rotationIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [awards, rotationIntervalMs, paused]);

  return {
    awards,
    current,
    loading,
    error,
    activeAward: awards[current] || null,
    hasAwards: awards.length > 0,
    setCurrent,
    refetch: fetchAwards, // Allow manual refresh
  };
}
