import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Incident {
  id: string;
  serviceName: string;
  errorType: string;
  stackTrace: string;
  rootCause?: string;
  recommendedAction?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: string;
  createdAt: string;
  analyzedAt?: string;
  rootCauseReasoning?: string;
  misconfigurationCheck?: string;
  codeFix?: string;
  severityNote?: string;
  confidenceJustification?: string;
  confidenceScore?: number;
  isGrounded?: boolean;
  source?: 'simulated' | 'webhook';
  fixStatus?: 'unresolved' | 'applied' | 'resolved' | 'failed';
  errorSignature?: string;
  historyInfo?: {
    resolved: number;
    failed: number;
  };
}

const NODE_DATA: Record<number, any> = {
  1: {
    tag: 'REACT / TAILWIND / CHART.JS',
    tagClass: 'text-indigo-300 bg-indigo-900/40 border-indigo-700/50',
    barColor: 'bg-indigo-500',
    title: '1. Web Dashboard (Visual UI)',
    desc: 'Front-end SRE Incident Control Room',
    text: 'Provides real-time SSE (Server-Sent Events) live updates. Engineers monitor active outages, view Mistral AI root-cause analysis, and execute instant hotfix patches.',
    serviceName: 'app-ui', techStack: 'React + Tailwind CSS', protocol: 'WebSocket / SSE', speed: '16 ms',
    cpu: 12, ram: 24, rps: 145, latency: 45,
    logs: [
      "[INFO] SSE Connection established with api-gateway",
      "[INFO] Rendered incident radar list",
      "[WARN] High memory usage detected in Chart.js canvas",
      "[INFO] Fetched Mistral AI payload successfully"
    ]
  },
  2: {
    tag: 'NODE.JS / EXPRESS',
    tagClass: 'text-cyan-300 bg-cyan-900/40 border-cyan-700/50',
    barColor: 'bg-cyan-500',
    title: '2. Express API Gateway',
    desc: 'High-throughput Crash Ingestion Router',
    text: 'Acts as the primary entry point for all telemetry and crash reports. Validates payloads and instantly offloads them to the Valkey cache to ensure zero-blocking on production threads.',
    serviceName: 'api-gateway', techStack: 'Node.js 20', protocol: 'REST / HTTP', speed: '< 10 ms',
    cpu: 45, ram: 58, rps: 4200, latency: 8,
    logs: [
      "[INFO] POST /api/v1/incidents 200 OK - 8ms",
      "[INFO] Payload validated against schema",
      "[INFO] Pushed incident to Valkey stream 'crash-events'",
      "[INFO] Emitted SSE update to app-ui"
    ]
  },
  3: {
    tag: 'VALKEY / REDIS ENGINE',
    tagClass: 'text-rose-300 bg-rose-900/40 border-rose-700/50',
    barColor: 'bg-rose-500',
    title: '3. High-Speed Bus',
    desc: 'Sub-millisecond Event Stream',
    text: 'Provides a highly resilient, in-memory queue. Even during massive cascading outages, the event bus absorbs the spike, preventing the API Gateway from crashing under load.',
    serviceName: 'valkey-bus', techStack: 'Valkey 7.2', protocol: 'Redis RESPful', speed: '< 2 ms',
    cpu: 18, ram: 82, rps: 8900, latency: 1,
    logs: [
      "[INFO] Client connected from api-gateway",
      "[INFO] XADD crash-events * payload ...",
      "[INFO] Memory eviction policy: allkeys-lru",
      "[WARN] Memory usage at 82%, preparing background save"
    ]
  },
  4: {
    tag: 'MISTRAL AI / LLM',
    tagClass: 'text-purple-300 bg-purple-900/40 border-purple-700/50',
    barColor: 'bg-purple-500',
    title: '4. AI Diagnostics',
    desc: 'Automated Root-Cause Analysis',
    text: 'A background worker processes events from Valkey, securely passing raw stack traces to Mistral AI. The LLM returns a human-readable diagnosis and actionable remediation step.',
    serviceName: 'ai-worker', techStack: 'Python / Mistral API', protocol: 'gRPC / HTTP', speed: '850 ms',
    cpu: 92, ram: 65, rps: 15, latency: 850,
    logs: [
      "[INFO] XREADGROUP consumer ai-worker-1 fetched 1 event",
      "[INFO] Initiating Mistral AI API prompt generation",
      "[INFO] Received successful 200 response from Mistral",
      "[INFO] Parsed JSON diagnosis and updated PostgreSQL"
    ]
  },
  5: {
    tag: 'POSTGRESQL 16',
    tagClass: 'text-amber-300 bg-amber-900/40 border-amber-700/50',
    barColor: 'bg-amber-500',
    title: '5. Incident Database',
    desc: 'Persistent Cold Storage',
    text: 'Stores long-term historical records of all incidents and AI diagnoses for auditing, analytics, and MTTR (Mean Time to Resolution) tracking.',
    serviceName: 'postgres-db', techStack: 'PostgreSQL 16', protocol: 'TCP/IP', speed: '24 ms',
    cpu: 34, ram: 45, rps: 350, latency: 12,
    logs: [
      "[INFO] Connection pool established (max: 100)",
      "[INFO] INSERT INTO incidents (service, severity, stack) VALUES ...",
      "[INFO] COMMIT successful",
      "[INFO] Executing scheduled VACUUM operation"
    ]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'zerops'>('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const isManualSelectionRef = useRef(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(1);
  const [simService, setSimService] = useState('payment-gateway-v1');
  const [simStack, setSimStack] = useState('');
  const [isEditingStack, setIsEditingStack] = useState(false);
  const [editedStack, setEditedStack] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadErrorText, setUploadErrorText] = useState('');
  const [simError, setSimError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'critical'>('all');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleUploadCodebase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional client-side size check (warn before Nginx 413 limit)
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadErrorText('File too large. Maximum size is 50MB.');
      setTimeout(() => setUploadStatus('idle'), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('codebase', file);

    try {
      const response = await fetch(`${API_BASE}/api/v1/codebase`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => setUploadStatus('idle'), 3000);
      } else {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        setUploadStatus('error');
        setUploadErrorText(errorMessage);
        setTimeout(() => setUploadStatus('idle'), 4000);
      }
    } catch (err) {
      setUploadStatus('error');
      setUploadErrorText('Network error while uploading codebase.');
      setTimeout(() => setUploadStatus('idle'), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/incidents`);
      if (response.ok) {
        const data: Incident[] = await response.json();
        setIncidents(data);
        if (data.length > 0) {
          setActiveIncident((currentActive) => {
            if (!isManualSelectionRef.current) return data[0];
            if (!currentActive) return data[0];
            const updatedActive = data.find((i) => i.id === currentActive.id);
            return updatedActive || currentActive;
          });
        }
      }
    } catch (err) {
      console.warn('Backend unreachable');
    }
  };

  useEffect(() => {
    fetchIncidents();
    
    // Fallback polling (15s) in case SSE gets blocked by firewalls/proxies
    const fallbackInterval = setInterval(fetchIncidents, 15000);

    // Setup Server-Sent Events (SSE)
    const eventSource = new EventSource(`${API_BASE}/api/v1/incidents/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const newIncident = JSON.parse(event.data);
        setIncidents(prev => {
          const index = prev.findIndex(i => i.id === newIncident.id);
          let newData = [...prev];
          if (index > -1) {
            newData[index] = newIncident;
          } else {
            newData.unshift(newIncident);
          }
          // Sort descending and enforce 50 limit to match backend
          newData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return newData.slice(0, 50);
        });

        setActiveIncident(current => {
          if (!current) return newIncident;
          if (current.id === newIncident.id) return newIncident;
          if (!isManualSelectionRef.current) return newIncident;
          return current;
        });
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error. Auto-reconnecting...', error);
      // EventSource auto-reconnects natively. Do a full refetch on reconnect to capture missed events.
      if (eventSource.readyState === 0) {
        fetchIncidents();
      }
    };

    return () => {
      clearInterval(fallbackInterval);
      eventSource.close();
    };
  }, []);

  const runSimulationPipeline = async () => {
    if (!simService.trim() || !simStack.trim()) {
      setSimError("Please provide both Service Name and Stack Trace.");
      setTimeout(() => setSimError(''), 5000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: simService,
          errorType: 'SimulatedCrash',
          stackTrace: simStack,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post incident");
      }

      setIsSimulatorOpen(false);
      setActiveTab('dashboard');
      isManualSelectionRef.current = false;
      fetchIncidents();
    } catch (err) {
      setSimError("Connection failed. Make sure the API Gateway is running on Port 3000!");
      setTimeout(() => setSimError(''), 5000);
    }
  };

  const handleResimulateFromEdit = async () => {
    if (!activeIncident) return;
    setIsEditingStack(false);
    try {
      await fetch(`${API_BASE}/api/v1/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: activeIncident.serviceName,
          errorType: 'EditedCrash',
          stackTrace: editedStack,
        }),
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const loadPreset = (type: string) => {
    if (type === 'mongo') {
      setSimService('auth-service-v2');
      setSimStack(`MongoServerSelectionError: connection timed out at MongoClient.connect
    at /app/node_modules/mongodb/lib/core/sdam/topology.js:438:11
    at /app/dist/services/auth.service.js:142:28`);
    } else if (type === 'oom') {
      setSimService('python-worker');
      setSimStack(`MemoryError: Cannot allocate memory for array
    at numpy.core.multiarray.zeros
    at model.predict(data)`);
    } else if (type === 'go') {
      setSimService('payment-processor');
      setSimStack(`panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x4a4d65]`);
    }
  };

  const updateFixStatus = async (status: 'unresolved' | 'applied' | 'resolved' | 'failed') => {
    if (!activeIncident) return;
    const previousStatus = activeIncident.fixStatus;
    setActiveIncident({ ...activeIncident, fixStatus: status });
    setIncidents(prev => prev.map(inc => inc.id === activeIncident.id ? { ...inc, fixStatus: status } : inc));

    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${activeIncident.id}/fix-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update fix status');
    } catch (err) {
      console.error(err);
      setActiveIncident({ ...activeIncident, fixStatus: previousStatus });
      setIncidents(prev => prev.map(inc => inc.id === activeIncident.id ? { ...inc, fixStatus: previousStatus } : inc));
    }
  };

  const deleteIncident = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/v1/incidents/${id}`, { method: 'DELETE' });
      
      const idx = incidents.findIndex(i => i.id === id);
      if (idx !== -1) {
        const filtered = [...incidents];
        filtered.splice(idx, 1);
        setIncidents(filtered);
        
        if (activeIncident?.id === id) {
          const nextActive = filtered[idx] || filtered[idx - 1] || null;
          setActiveIncident(nextActive);
        }
      }
    } catch (err) {
      console.error('Failed to delete incident');
    }
  };

  const handleNodeClick = (nodeId: number) => {
    setSelectedNode(nodeId);
  };

  const activeCritical = incidents.filter(i => i.severity === 'CRITICAL').length;

  // --- Dynamic Dashboard Metrics ---
  const analyzedIncidents = incidents.filter(i => i.status === 'ANALYZED' && i.analyzedAt);
  
  // Pending Queue: Incidents waiting for AI processing
  const pendingQueueCount = incidents.filter(i => i.status === 'DETECTED').length;
  
  // AI Latency: Difference between creation and analysis of the most recent resolved incident
  let latestAiLatencyMs = 780; // default fallback
  if (analyzedIncidents.length > 0) {
    const latest = analyzedIncidents[0]; // the feed is sorted newest first
    const createdTs = new Date(latest.createdAt).getTime();
    const analyzedTs = new Date(latest.analyzedAt!).getTime();
    latestAiLatencyMs = Math.max(0, analyzedTs - createdTs);
  }

  // MTTR Savings: Compare 45 minutes to average AI resolution time
  const manualResolutionMs = 2700000; // 45 mins
  let avgAiLatencyMs = 1200; // default 1.2s fallback
  
  if (analyzedIncidents.length > 0) {
    const totalMs = analyzedIncidents.reduce((sum, inc) => {
      return sum + (new Date(inc.analyzedAt!).getTime() - new Date(inc.createdAt).getTime());
    }, 0);
    avgAiLatencyMs = totalMs / analyzedIncidents.length;
  }
  
  const savedPercentage = Math.max(0, ((manualResolutionMs - avgAiLatencyMs) / manualResolutionMs) * 100);
  const formattedSavedPercentage = savedPercentage.toFixed(1);
  const avgAiTimeSeconds = (avgAiLatencyMs / 1000).toFixed(1);

  const filteredIncidents = incidents.filter(inc => {
    // Status filter
    if (statusFilter === 'unresolved' && inc.fixStatus && inc.fixStatus !== 'unresolved') return false;
    if (statusFilter === 'critical' && inc.severity !== 'CRITICAL') return false;
    
    // Search query (substring matching)
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      if (!inc.serviceName.toLowerCase().includes(lowerQ) &&
          !inc.errorType.toLowerCase().includes(lowerQ) &&
          !(inc.stackTrace && inc.stackTrace.toLowerCase().includes(lowerQ))) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-emerald-500 selection:text-black font-sans bg-[#060911] text-slate-100">

      {/* TOP NAVIGATION BAR */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img src="/favicon.svg" alt="OutageIQ Logo" className="w-10 h-10 shadow-lg shadow-rose-900/30" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Outage<span className="text-rose-500">IQ</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Automated AI Root-Cause Analysis & Real-time SRE Incident Room</p>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 hidden md:flex">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-network-wired"></i>
            <span>UX Architecture Map</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-desktop"></i>
            <span>Live SRE Incident Room</span>
          </button>
          <button
            onClick={() => setActiveTab('zerops')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'zerops' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-server"></i>
            <span>Zerops Deployment Spec</span>
          </button>
        </div>

        {/* Quick Action CTA */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".zip"
            ref={fileInputRef}
            onChange={handleUploadCodebase}
            className="hidden"
          />
          {uploadStatus === 'success' ? (
            <div className="px-3.5 py-1.5 h-[34px] rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in zoom-in">
              <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                <i className="fa-solid fa-check"></i>
              </span>
              <span className="text-xs font-bold hidden md:inline">Uploaded</span>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="px-3.5 py-1.5 h-[34px] rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-2 animate-in fade-in zoom-in" title={uploadErrorText}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span className="text-xs font-bold hidden md:inline truncate max-w-[120px]">{uploadErrorText || 'Failed'}</span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 h-[34px] text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-md border border-slate-700 transition-all flex items-center gap-2"
            >
              <i className={`fa-solid ${isUploading ? 'fa-spinner fa-spin text-slate-400' : 'fa-file-zipper text-indigo-400'}`}></i>
              <span className="hidden md:inline">{isUploading ? 'Uploading...' : 'Upload Codebase (.zip)'}</span>
            </button>
          )}
          <button onClick={() => setIsSimulatorOpen(true)} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-900/30 transition-all flex items-center gap-2">
            <i className="fa-solid fa-bug animate-bounce"></i>
            <span className="hidden md:inline">Simulate Stack Trace Crash</span>
            <span className="md:hidden">Simulate Crash</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* =================================================================== */}
        {/* TAB 1: UX ARCHITECTURE MAP */}
        {/* =================================================================== */}
        {activeTab === 'map' && (
          <section className="space-y-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 relative overflow-hidden shadow-2xl">
              <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <i className="fa-solid fa-sitemap"></i> High-Speed Zero-Downtime Telemetry Flow
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">System Architecture & Interactive UX Pipeline</h2>
                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    How OutageIQ transforms raw stack traces into instant actionable fixes in <strong className="text-white">&lt;850ms</strong> without blocking production workloads.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-center px-3 border-r border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Ingestion SLA</span>
                    <span className="text-lg font-extrabold text-emerald-400">&lt; 10ms</span>
                  </div>
                  <div className="text-center px-3 border-r border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Queue Engine</span>
                    <span className="text-lg font-extrabold text-rose-400">Valkey (Redis)</span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">AI Diagnostics</span>
                    <span className="text-lg font-extrabold text-purple-400">Mistral AI</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-slate-950 rounded-2xl border border-slate-800/80 p-6 shadow-2xl overflow-hidden min-h-[520px] flex flex-col justify-between">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

              <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Interactive Architecture Map • Click any node to inspect service metrics
                </span>
              </div>

              <div className="relative">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 my-auto">
                  <div onClick={() => handleNodeClick(1)} className={`cursor-pointer transition-all border p-5 rounded-2xl flex flex-col justify-between space-y-4 ${selectedNode === 1 ? 'bg-slate-800 border-indigo-400 glow-blue scale-105' : 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">Node 1</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg mb-2">
                        <i className="fa-solid fa-desktop"></i>
                      </div>
                      <h3 className="font-bold text-white text-base">1. Web Dashboard</h3>
                      <p className="text-xs text-slate-400">Visual UI (React / Tailwind)</p>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Service: <span className="text-indigo-300">app-ui</span><br />
                      Port: <span className="text-amber-300">3000</span>
                    </div>
                  </div>

                  <div onClick={() => handleNodeClick(2)} className={`cursor-pointer transition-all border p-5 rounded-2xl flex flex-col justify-between space-y-4 ${selectedNode === 2 ? 'bg-slate-800 border-cyan-400 glow-blue scale-105' : 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">Node 2</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg mb-2">
                        <i className="fa-solid fa-network-wired"></i>
                      </div>
                      <h3 className="font-bold text-white text-base">2. Express API Gateway</h3>
                      <p className="text-xs text-slate-400">Crash Ingestion Router</p>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Service: <span className="text-cyan-300">api-gateway</span><br />
                      Endpoint: <span className="text-emerald-300">/api/v1/ingest</span>
                    </div>
                  </div>

                  <div onClick={() => handleNodeClick(3)} className={`cursor-pointer transition-all border p-5 rounded-2xl flex flex-col justify-between space-y-4 ${selectedNode === 3 ? 'bg-slate-800 border-rose-400 glow-red scale-105' : 'bg-slate-900/90 border-rose-500/40 hover:border-rose-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50">Node 3</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg mb-2">
                        <i className="fa-solid fa-bolt"></i>
                      </div>
                      <h3 className="font-bold text-white text-base">3. High-Speed Bus</h3>
                      <p className="text-xs text-slate-400">Valkey / Redis Event Stream</p>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Service: <span className="text-rose-300">valkey-bus</span><br />
                      Latency: <span className="text-emerald-300">&lt;2ms</span>
                    </div>
                  </div>

                  <div onClick={() => handleNodeClick(4)} className={`cursor-pointer transition-all border p-5 rounded-2xl flex flex-col justify-between space-y-4 ${selectedNode === 4 ? 'bg-slate-800 border-purple-400 glow-purple scale-105' : 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">Node 4</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg mb-2">
                        <i className="fa-solid fa-brain"></i>
                      </div>
                      <h3 className="font-bold text-white text-base">4. AI Diagnostics</h3>
                      <p className="text-xs text-slate-400">Mistral LLM Root Cause</p>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Service: <span className="text-purple-300">ai-worker</span><br />
                      Engine: <span className="text-purple-300">Mistral Large</span>
                    </div>
                  </div>

                  <div onClick={() => handleNodeClick(5)} className={`cursor-pointer transition-all border p-5 rounded-2xl flex flex-col justify-between space-y-4 ${selectedNode === 5 ? 'bg-slate-800 border-amber-400 scale-105' : 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">Node 5</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg mb-2">
                        <i className="fa-solid fa-database"></i>
                      </div>
                      <h3 className="font-bold text-white text-base">5. Incident Database</h3>
                      <p className="text-xs text-slate-400">PostgreSQL Storage</p>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Service: <span className="text-amber-300">postgres-db</span><br />
                      Records: <span className="text-indigo-300">Indexed Traces</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM CAPTION FOR MAP */}
              <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Web Dashboard</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Express API</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Valkey Queue</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Mistral AI Engine</span>
                </div>
                <span className="font-mono text-slate-500">Zerops Orchestrated Container Mesh</span>
              </div>

              {/* NODE DETAIL DRAWER */}
              {selectedNode !== null && (
                <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 shadow-xl relative mt-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Column 1: Config & Description */}
                    <div className="xl:col-span-1 space-y-4 flex flex-col justify-between">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${NODE_DATA[selectedNode].tagClass}`}>
                          {NODE_DATA[selectedNode].tag}
                        </span>
                        <div className="mt-4">
                          <h3 className="text-2xl font-bold text-white tracking-tight">{NODE_DATA[selectedNode].title}</h3>
                          <p className="text-sm text-slate-400 mt-1">{NODE_DATA[selectedNode].desc}</p>
                        </div>

                        {selectedNode === 1 && (
                          <button onClick={() => setActiveTab('dashboard')} className="mt-4 px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/30 transition flex items-center gap-2">
                            <i className="fa-solid fa-desktop"></i> View Live Dashboard
                          </button>
                        )}

                        <p className="text-sm text-slate-300 leading-relaxed pt-4">
                          {NODE_DATA[selectedNode].text}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 mt-auto">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ZEROPS SERVICE</span>
                          <span className="text-sm font-bold text-slate-200 font-mono">{NODE_DATA[selectedNode].serviceName}</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">TECH STACK</span>
                          <span className="text-sm font-bold text-slate-200">{NODE_DATA[selectedNode].techStack}</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">PROTOCOL</span>
                          <span className="text-sm font-bold text-slate-200">{NODE_DATA[selectedNode].protocol}</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">SPEED SLA</span>
                          <span className="text-sm font-bold text-slate-200">{NODE_DATA[selectedNode].speed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Live Resource Gauges */}
                    <div className="xl:col-span-1 space-y-4 flex flex-col">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-chart-pie text-emerald-400"></i> Live Resource Gauges
                      </h4>
                      <div className="flex-1 bg-slate-900/50 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-center space-y-6">
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-2">
                            <span className="text-slate-400">CPU Load (Cores)</span>
                            <span className="text-emerald-400">{NODE_DATA[selectedNode].cpu}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${NODE_DATA[selectedNode].barColor}`} style={{ width: `${NODE_DATA[selectedNode].cpu}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-2">
                            <span className="text-slate-400">RAM Allocation</span>
                            <span className="text-cyan-400">{NODE_DATA[selectedNode].ram}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${NODE_DATA[selectedNode].ram}%` }}></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">THROUGHPUT</span>
                            <span className="text-2xl font-bold text-white font-mono">{NODE_DATA[selectedNode].rps} <span className="text-xs text-slate-500">req/s</span></span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">P99 LATENCY</span>
                            <span className="text-2xl font-bold text-white font-mono">{NODE_DATA[selectedNode].latency} <span className="text-xs text-slate-500">ms</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Live Telemetry Log Console */}
                    <div className="xl:col-span-1 flex flex-col">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-terminal text-slate-400"></i> Telemetry Logs
                      </h4>
                      <div className="flex-1 bg-[#030508] border border-slate-800 rounded-xl p-4 font-mono text-[10px] md:text-xs text-slate-300 overflow-y-auto max-h-[300px]">
                        <div className="space-y-2">
                          <div className="text-emerald-500">zerops-cli connect {NODE_DATA[selectedNode].serviceName} --tail</div>
                          {NODE_DATA[selectedNode].logs.map((log: string, idx: number) => (
                            <div key={idx} className="opacity-80 break-words">
                              <span className="text-slate-500">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span> {log}
                            </div>
                          ))}
                          <div className="animate-pulse flex items-center gap-1 mt-2">
                            <div className="w-2 h-4 bg-slate-500"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 2: LIVE SRE INCIDENT ROOM DASHBOARD */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <section className="space-y-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TOP METRICS STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xl font-bold">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Active Outages</span>
                  <span className="text-2xl font-extrabold text-white">{activeCritical} Critical</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
                  <i className="fa-solid fa-stopwatch"></i>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">MTTR Savings</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{formattedSavedPercentage}% <span className="text-xs font-normal text-slate-400">(45m → {avgAiTimeSeconds}s)</span></span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">AI Latency</span>
                  <span className="text-2xl font-extrabold text-purple-400">{latestAiLatencyMs} ms</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
                  <i className="fa-solid fa-server"></i>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Valkey Stream</span>
                  <span className="text-2xl font-extrabold text-indigo-300">{pendingQueueCount} Pending Queue</span>
                </div>
              </div>
            </div>

            {/* MAIN SRE WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT SIDEBAR: INCIDENT FEED LIST */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-950/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incident Radar Feed</h3>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded-full">{filteredIncidents.length} Captured</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                      <input 
                        type="text" 
                        placeholder="Search service, error, or trace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors ${statusFilter === 'all' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setStatusFilter('unresolved')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors ${statusFilter === 'unresolved' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                      >
                        Unresolved
                      </button>
                      <button 
                        onClick={() => setStatusFilter('critical')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors ${statusFilter === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                      >
                        Critical
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
                  {filteredIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => { isManualSelectionRef.current = true; setActiveIncident(inc); setIsEditingStack(false); }}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${activeIncident?.id === inc.id ? 'bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-900/20' : 'bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            inc.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            inc.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {inc.severity}
                          </span>
                          {inc.source === 'webhook' && (
                            <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => deleteIncident(inc.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 focus:outline-none"
                            title="Delete Incident"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 truncate">{inc.errorType} in {inc.serviceName}</h4>
                      <p className="text-xs text-slate-400 truncate mt-1">{inc.rootCause || "Analyzing..."}</p>
                    </div>
                  ))}
                  {filteredIncidents.length === 0 && incidents.length > 0 && (
                    <div className="text-center p-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                      <i className="fa-solid fa-magnifying-glass text-2xl opacity-50"></i>
                      <span>No incidents match your search or filters.</span>
                    </div>
                  )}
                  {incidents.length === 0 && (
                    <div className="text-center p-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                      <i className="fa-solid fa-shield-check text-2xl opacity-50 text-emerald-500/50"></i>
                      <span>No incidents active. All systems green.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT MAIN PANEL: ACTIVE INCIDENT ROOM */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] overflow-hidden shadow-2xl">
                {activeIncident ? (
                  <>
                    <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-lg border ${
                          activeIncident.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
                          activeIncident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        }`}>
                          {activeIncident.severity}
                        </span>
                        {activeIncident.source === 'webhook' && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-md flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span> LIVE
                          </span>
                        )}
                        <div>
                          <h2 className="text-base font-bold text-white">{activeIncident.errorType} in {activeIncident.serviceName}</h2>
                          <p className="text-xs text-slate-400 font-mono">ID: {activeIncident.id} • Microservice: {activeIncident.serviceName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                      {/* AI DIAGNOSIS */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-950 border border-purple-500/30 shadow-xl space-y-4 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-sm">
                              <i className="fa-solid fa-brain"></i>
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-white">Mistral AI Root-Cause Verdict</h3>
                              <p className="text-[11px] text-purple-300">Automated stack trace analysis & code resolution model</p>
                            </div>
                          </div>
                          {activeIncident.rootCause ? (
                            <span 
                              className="text-xs font-mono bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-full border border-purple-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-500 max-w-[50%] truncate cursor-help"
                              title={typeof activeIncident.confidenceJustification === 'string' ? activeIncident.confidenceJustification : "Confidence High"}
                            >
                              <i className="fa-solid fa-check-circle text-emerald-400"></i> {activeIncident.confidenceScore !== undefined ? `${activeIncident.confidenceScore}% Confidence` : (typeof activeIncident.confidenceJustification === 'string' ? activeIncident.confidenceJustification : "Confidence High")}
                            </span>
                          ) : (
                            <span className="text-xs font-mono bg-purple-900/40 text-purple-400/80 px-2.5 py-1 rounded-full border border-purple-700/50 flex items-center gap-1.5 animate-pulse">
                              <i className="fa-solid fa-spinner animate-spin"></i> Analyzing
                            </span>
                          )}
                        </div>

                        {activeIncident.historyInfo && (activeIncident.historyInfo.resolved > 0 || activeIncident.historyInfo.failed > 0) && (
                          <div className="text-[11px] text-purple-300/80 italic animate-in fade-in pt-1">
                            <i className="fa-solid fa-clock-rotate-left mr-1"></i>
                            This error type has been seen {activeIncident.historyInfo.resolved + activeIncident.historyInfo.failed} times before — {activeIncident.historyInfo.resolved} resolved, {activeIncident.historyInfo.failed} failed.
                          </div>
                        )}

                        {!activeIncident.rootCause ? (
                          <div className="bg-slate-950/80 p-6 rounded-xl border border-purple-900/50 flex flex-col items-center justify-center space-y-4 relative z-10 min-h-[120px]">
                            <div className="flex space-x-2">
                              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
                            </div>
                            <p className="text-[11px] text-purple-300 font-mono animate-pulse tracking-widest">
                              MISTRAL NEURAL ENGINE PROCESSING...
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-950/80 p-5 rounded-xl border border-purple-900/50 space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Summary Diagnosis</span>
                              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                                {typeof activeIncident.rootCause === 'string' ? activeIncident.rootCause : JSON.stringify(activeIncident.rootCause)}
                              </p>
                            </div>

                            {activeIncident.rootCauseReasoning && (
                              <div className="space-y-1 pt-4 border-t border-purple-900/30">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Root Cause Reasoning</span>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                  {typeof activeIncident.rootCauseReasoning === 'string' ? activeIncident.rootCauseReasoning : JSON.stringify(activeIncident.rootCauseReasoning)}
                                </p>
                              </div>
                            )}

                            {activeIncident.misconfigurationCheck && (
                              <div className="space-y-1 pt-4 border-t border-purple-900/30">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <i className="fa-solid fa-triangle-exclamation"></i> Misconfiguration Flag
                                </span>
                                <p className="text-sm text-amber-200/80 leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/30">
                                  {typeof activeIncident.misconfigurationCheck === 'string' ? activeIncident.misconfigurationCheck : JSON.stringify(activeIncident.misconfigurationCheck)}
                                </p>
                              </div>
                            )}

                            <div className="space-y-1 pt-4 border-t border-purple-900/30">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <i className="fa-solid fa-code"></i> {activeIncident.isGrounded ? 'Grounded Code Fix (Diff)' : 'Code-Level Fix'}
                                </span>
                                {activeIncident.codeFix ? (
                                  <>
                                    {!activeIncident.isGrounded && (
                                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                                        Generic fix — upload codebase for specific patch
                                      </span>
                                    )}
                                    {activeIncident.isGrounded && (
                                      <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                                        Context-Aware Diff
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded border border-slate-600/30">
                                    No Code Diff
                                  </span>
                                )}
                              </div>
                              
                              {activeIncident.codeFix ? (
                                <div className="mt-2 text-sm rounded-lg overflow-hidden border border-emerald-900/30 shadow-inner bg-slate-950/80">
                                  <SyntaxHighlighter
                                    language="typescript"
                                    style={vscDarkPlus}
                                    showLineNumbers={true}
                                    customStyle={{ margin: 0, padding: '1rem', backgroundColor: 'transparent' }}
                                    wrapLines={true}
                                    lineProps={(lineNumber: number) => {
                                      const lines = (typeof activeIncident.codeFix === 'string' ? activeIncident.codeFix : JSON.stringify(activeIncident.codeFix, null, 2)).split('\n');
                                      const line = lines[lineNumber - 1] || '';
                                      let style: React.CSSProperties = { display: 'block', minHeight: '1.25rem' };
                                      if (line.startsWith('+')) {
                                        style.backgroundColor = 'rgba(16, 185, 129, 0.15)'; // Emerald
                                      } else if (line.startsWith('-')) {
                                        style.backgroundColor = 'rgba(244, 63, 94, 0.15)'; // Rose
                                      }
                                      return { style };
                                    }}
                                  >
                                    {typeof activeIncident.codeFix === 'string' ? activeIncident.codeFix : JSON.stringify(activeIncident.codeFix, null, 2)}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <div className="mt-2 p-6 rounded-lg bg-slate-900/50 border border-slate-800/50 flex flex-col items-center justify-center text-center space-y-2">
                                  <i className="fa-solid fa-file-code text-slate-600 text-2xl"></i>
                                  <p className="text-sm text-slate-400 font-medium">No automated code fix generated for this incident.</p>
                                  <p className="text-[11px] text-slate-500">The AI could not confidently determine a safe code-level patch based on the provided context.</p>
                                </div>
                              )}
                              
                              <div className="mt-4 flex flex-wrap gap-3 items-center border-t border-purple-900/30 pt-4">
                                  {(!activeIncident.fixStatus || activeIncident.fixStatus === 'unresolved') && (
                                    <button
                                      onClick={() => updateFixStatus('applied')}
                                      className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-900/50"
                                    >
                                      <i className="fa-solid fa-hammer mr-2"></i> Mark as Applied
                                    </button>
                                  )}
                                  
                                  {activeIncident.fixStatus === 'applied' && (
                                    <>
                                      <button
                                        onClick={() => updateFixStatus('resolved')}
                                        className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/50"
                                      >
                                        <i className="fa-solid fa-check mr-2"></i> Mark Resolved (Worked)
                                      </button>
                                      <button
                                        onClick={() => updateFixStatus('failed')}
                                        className="text-xs font-bold px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/50"
                                      >
                                        <i className="fa-solid fa-xmark mr-2"></i> Didn't Work (Failed)
                                      </button>
                                    </>
                                  )}
                                  
                                  {activeIncident.fixStatus === 'resolved' && (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-900/50">
                                      <i className="fa-solid fa-check-circle mr-1.5"></i> Fix Confirmed Resolved
                                    </span>
                                  )}
                                  
                                  {activeIncident.fixStatus === 'failed' && (
                                    <span className="text-xs font-bold text-rose-400 bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-900/50">
                                      <i className="fa-solid fa-xmark-circle mr-1.5"></i> Fix Failed
                                    </span>
                                  )}
                                </div>
                              </div>

                            {activeIncident.severityNote && (
                              <div className="space-y-1 pt-4 border-t border-purple-900/30">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <i className="fa-solid fa-radiation"></i> Stability Risk
                                </span>
                                <p className="text-sm text-rose-200/90 leading-relaxed bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/30">
                                  {typeof activeIncident.severityNote === 'string' ? activeIncident.severityNote : JSON.stringify(activeIncident.severityNote)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* STACK TRACE VIEWER */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <i className="fa-solid fa-code text-rose-400"></i> Ingested Stack Trace
                          </span>
                          {!isEditingStack ? (
                            <button 
                              onClick={() => { setIsEditingStack(true); setEditedStack(activeIncident.stackTrace); }}
                              className="text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                              title="Edit Stack Trace"
                            >
                              <i className="fa-solid fa-pencil text-xs"></i>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsEditingStack(false)}
                                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleResimulateFromEdit}
                                className="text-[10px] uppercase font-bold text-indigo-100 hover:text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded shadow-lg shadow-indigo-600/20"
                              >
                                Re-Simulate
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-rose-300 leading-relaxed max-h-48">
                          {!isEditingStack ? (
                            <pre className="overflow-x-auto whitespace-pre-wrap">{activeIncident.stackTrace}</pre>
                          ) : (
                            <textarea
                              value={editedStack}
                              onChange={(e) => setEditedStack(e.target.value)}
                              className="w-full h-32 bg-transparent text-rose-300 outline-none resize-none focus:ring-0 p-0 border-none"
                            />
                          )}
                        </div>
                      </div>

                      {/* REMEDIATION */}
                      {activeIncident.recommendedAction && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Suggested SRE Remediation Playbook</span>
                          <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                            <i className="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
                            <span className="font-medium text-emerald-200">{typeof activeIncident.recommendedAction === 'string' ? activeIncident.recommendedAction : JSON.stringify(activeIncident.recommendedAction)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-3xl mb-6 shadow-lg shadow-indigo-900/20">
                      <i className="fa-solid fa-rocket"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome to OutageIQ SRE Room</h2>
                    <p className="text-slate-400 max-w-lg mb-10 text-sm">Your AI-powered incident resolution center. Here is a quick guide on how to navigate and use the features available.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900/80 transition-all cursor-default group shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-bug"></i>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2">1. Simulate a Crash</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Click <span className="text-rose-300 font-mono">Simulate Stack Trace</span> in the header to inject a fake outage. Choose a preset or write your own to test the pipeline.
                        </p>
                      </div>

                      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-default group shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-satellite-dish"></i>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2">2. Monitor the Feed</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          New crashes arrive instantly in the <strong className="text-slate-300">Incident Radar Feed</strong> on the left. The app auto-tracks the newest one unless you click an older one.
                        </p>
                      </div>

                      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all cursor-default group shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-brain"></i>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2">3. Mistral AI Diagnosis</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          The AI worker analyzes the raw stack trace in the background. Once processed, it returns a clear root cause and an actionable remediation step.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ZEROPS DEPLOYMENT SPECIFICATION */}
        {/* =================================================================== */}
        {activeTab === 'zerops' && (
          <section className="space-y-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 md:p-8 rounded-[1.25rem] bg-[#070b14] border border-[#111827] shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-[0.15em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span> ZEROPS NATIVE INFRASTRUCTURE BLUEPRINT
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Project Infrastructure & Container Specifications</h2>
                <p className="text-sm text-slate-400">Zero-downtime microservices architecture configured for the Zerops Hackathon</p>
              </div>
              <a href="https://github.com/shoaibkhan-sde/outage-iq/blob/main/zerops.yaml" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition shadow-lg shadow-emerald-500/5 flex items-center gap-2 shrink-0">
                <i className="fa-brands fa-github"></i> View Zerops YAML Spec
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0b101a] border border-[#1e293b] rounded-[1.25rem] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <i className="fa-solid fa-file-code"></i> zerops.yaml
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Zerops Build & Runtime Orchestrator
                  </span>
                </div>
                <div className="p-1 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto">
                  <pre>
                    <span className="text-purple-400">project:</span>
                    <br />
                    {'  '}<span className="text-rose-400">name:</span> <span className="text-slate-300">outageiq</span>
                    <br />
                    {'  '}<span className="text-rose-400">tags:</span> <span className="text-slate-300">[hackathon, sre, ai]</span>
                    <br /><br />
                    <span className="text-purple-400">services:</span>
                    <br />
                    {'  '}- <span className="text-rose-400">hostname:</span> <span className="text-slate-300">api-gateway</span>
                    <br />
                    {'    '}<span className="text-rose-400">type:</span> <span className="text-slate-300">nodejs@20</span>
                    <br />
                    {'    '}<span className="text-purple-400">build:</span>
                    <br />
                    {'      '}<span className="text-rose-400">buildCommands:</span> <span className="text-amber-200">npm install && npm run build</span>
                    <br />
                    {'      '}<span className="text-rose-400">deployFiles:</span> <span className="text-slate-300">[dist, package.json]</span>
                    <br />
                    {'    '}<span className="text-purple-400">run:</span>
                    <br />
                    {'      '}<span className="text-rose-400">start:</span> <span className="text-amber-200">node dist/index.js</span>
                    <br />
                    {'      '}<span className="text-purple-400">envVariables:</span>
                    <br />
                    {'        '}<span className="text-rose-400">VALKEY_URL:</span> <span className="text-amber-200">valkey-bus:6379</span>
                    <br /><br />
                    {'  '}- <span className="text-rose-400">hostname:</span> <span className="text-slate-300">valkey-bus</span>
                    <br />
                    {'    '}<span className="text-rose-400">type:</span> <span className="text-slate-300">valkey@7.2</span>
                    <br />
                    {'    '}<span className="text-rose-400">mode:</span> <span className="text-amber-200">standalone</span>
                    <br /><br />
                    {'  '}- <span className="text-rose-400">hostname:</span> <span className="text-slate-300">ai-worker</span>
                    <br />
                    {'    '}<span className="text-rose-400">type:</span> <span className="text-slate-300">nodejs@20</span>
                    <br />
                    {'    '}<span className="text-purple-400">run:</span>
                    <br />
                    {'      '}<span className="text-rose-400">start:</span> <span className="text-amber-200">node dist/worker.js</span>
                    <br />
                    {'      '}<span className="text-purple-400">envVariables:</span>
                    <br />
                    {'        '}<span className="text-rose-400">MISTRAL_API_KEY:</span> <span className="text-amber-200">${'{'}MISTRAL_API_KEY{'}'}</span>
                    <br />
                    {'        '}<span className="text-rose-400">DATABASE_URL:</span> <span className="text-amber-200">postgres-db:5432</span>
                    <br /><br />
                    {'  '}- <span className="text-rose-400">hostname:</span> <span className="text-slate-300">postgres-db</span>
                    <br />
                    {'    '}<span className="text-rose-400">type:</span> <span className="text-slate-300">postgresql@16</span>
                  </pre>
                </div>
              </div>

              <div className="bg-[#0b101a] border border-[#1e293b] rounded-[1.25rem] p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <i className="fa-solid fa-layer-group text-indigo-400"></i> Project Architecture Stack
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <i className="fa-solid fa-desktop text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Frontend</span>
                        <span className="text-sm font-bold text-slate-200">React (Vite SPA)</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <i className="fa-solid fa-code text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">API</span>
                        <span className="text-sm font-bold text-slate-200">Node.js (Express)</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <i className="fa-solid fa-database text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Database</span>
                        <span className="text-sm font-bold text-slate-200">PostgreSQL 16</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <i className="fa-solid fa-bolt text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cache</span>
                        <span className="text-sm font-bold text-slate-200">Valkey 7.2</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <i className="fa-solid fa-gears text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Workers</span>
                        <span className="text-sm font-bold text-slate-200">AI Background Worker</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#050810] rounded-xl border border-[#1e293b] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <i className="fa-solid fa-hard-drive text-lg"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Storage</span>
                        <span className="text-sm font-bold text-slate-200">Valkey (Indexed Codebase)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 flex items-center gap-3">
                    <i className="fa-solid fa-network-wired text-emerald-400"></i>
                    <span className="text-sm font-bold text-slate-300">Secure Private Network</span>
                    <span className="text-xs text-slate-500 ml-auto">Internal isolation</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#1e293b] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Zerops Service Count</span>
                    <span className="text-lg font-bold text-white">4 Containers + 1 Database</span>
                  </div>
                  <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-lg border border-emerald-500/30">
                    READY FOR PRODUCTION
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* =================================================================== */}
      {/* SIMULATOR MODAL */}
      {/* =================================================================== */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <i className="fa-solid fa-bug text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live OutageIQ Ingestion Simulator</h3>
                  <p className="text-xs text-slate-400">Inject a stack trace to trigger real-time Valkey queuing & AI diagnosis</p>
                </div>
              </div>
              <button onClick={() => setIsSimulatorOpen(false)} className="text-slate-400 hover:text-white p-2 text-lg">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Choose Outage Scenario</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button onClick={() => loadPreset('mongo')} className="p-2 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left truncate transition">
                  ⚡ Node Mongo Timeout
                </button>
                <button onClick={() => loadPreset('oom')} className="p-2 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left truncate transition">
                  🔥 Python Memory OOM
                </button>
                <button onClick={() => loadPreset('go')} className="p-2 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left truncate transition">
                  💥 Go Nil Pointer Panic
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Service Error Stack Trace</label>
              </div>
              <textarea
                value={simStack}
                onChange={(e) => setSimStack(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-rose-300 focus:outline-none focus:border-rose-500 placeholder-slate-600"
                placeholder="Paste stack trace here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Microservice Name</label>
                <input
                  type="text"
                  value={simService}
                  onChange={(e) => setSimService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex-1">
                {simError && (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 animate-in fade-in">
                    <i className="fa-solid fa-triangle-exclamation mr-1"></i> {simError}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => setIsSimulatorOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition">
                  Cancel
                </button>
                <button onClick={runSimulationPipeline} className="px-5 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-900/30 transition flex items-center gap-2">
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Push to Express API Ingestion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}