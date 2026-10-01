import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  TrendingUp,
  Zap,
  ShieldAlert,
  Users,
  CheckCircle2,
  Copy,
  Sparkles,
  Download,
  Bookmark,
  Globe,
  MapPin,
  ExternalLink,
  FileText,
  Layers,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Trash2,
  Share2,
  Send,
  Plus,
  BookmarkCheck,
  Filter
} from 'lucide-react';

interface Signal {
  category: 'Growth & Expansion' | 'Executive Movement' | 'Tech Stack & Digital Transformation' | 'Operational Pain Points' | string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  title: string;
  description: string;
  source: string;
}

interface OutreachHook {
  category: 'Problem-Agitate' | 'Peer-to-Peer' | 'Value-Led' | string;
  title: string;
  hookText: string;
  wordCount: number;
}

interface LeadData {
  companyName: string;
  domain: string;
  industry: string;
  companySize: string;
  headquarters: string;
  summary: string;
  intentScore: number;
  signals: Signal[];
  outreachHooks: OutreachHook[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'discovery' | 'batch' | 'saved'>('analyzer');
  const [domainInput, setDomainInput] = useState('');
  const [icpContext, setIcpContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const [currentLead, setCurrentLead] = useState<LeadData | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [savedLeads, setSavedLeads] = useState<LeadData[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // Discovery state
  const [discoveryIndustry, setDiscoveryIndustry] = useState('FinTech & SaaS');
  const [discoveryRegion, setDiscoveryRegion] = useState('North America');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<LeadData[]>([]);

  // Batch state
  const [batchInput, setBatchInput] = useState('stripe.com\ndatadog.com\nlinear.app');
  const [batchResults, setBatchResults] = useState<LeadData[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('signalpulse_saved_leads');
    if (stored) {
      try {
        setSavedLeads(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveLeadToStorage = (lead: LeadData) => {
    if (savedLeads.some(l => l.domain.toLowerCase() === lead.domain.toLowerCase())) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
      return;
    }
    const updated = [lead, ...savedLeads];
    setSavedLeads(updated);
    localStorage.setItem('signalpulse_saved_leads', JSON.stringify(updated));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const removeSavedLead = (domain: string) => {
    const updated = savedLeads.filter(l => l.domain !== domain);
    setSavedLeads(updated);
    localStorage.setItem('signalpulse_saved_leads', JSON.stringify(updated));
  };

  const analyzeLead = async (targetDomain?: string) => {
    const query = targetDomain || domainInput;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setNotice(null);
    setCurrentLead(null);
    setLoadingStep(1);

    const stepsTimer1 = setTimeout(() => setLoadingStep(2), 2500);
    const stepsTimer2 = setTimeout(() => setLoadingStep(3), 5000);

    try {
      const res = await fetch('/api/analyze-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainOrProfile: query, icpCriteria: icpContext }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze target company');

      setCurrentLead(data.data);
      setSources(data.sources || []);
      setNotice(data.notice || null);
    } catch (err: any) {
      setError(err.message || 'An error occurred during intent analysis.');
    } finally {
      clearTimeout(stepsTimer1);
      clearTimeout(stepsTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const discoverLeads = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const res = await fetch('/api/discover-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: discoveryIndustry, region: discoveryRegion, count: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to discover leads');
      setDiscoveredLeads(data.leads || []);
    } catch (err: any) {
      setError(err.message || 'Failed to discover leads');
    } finally {
      setDiscovering(false);
    }
  };

  const runBatchAnalysis = async () => {
    const domains = batchInput.split('\n').map(d => d.trim()).filter(Boolean);
    if (domains.length === 0) return;

    setBatchLoading(true);
    const results: LeadData[] = [];
    for (const d of domains) {
      try {
        const res = await fetch('/api/analyze-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainOrProfile: d }),
        });
        const data = await res.json();
        if (res.ok && data.data) {
          results.push(data.data);
        }
      } catch (e) {
        console.error(`Failed for ${d}`, e);
      }
    }
    setBatchResults(results);
    setBatchLoading(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportToCSV = (leadsToExport: LeadData[]) => {
    if (leadsToExport.length === 0) return;
    const headers = ['Company', 'Domain', 'Industry', 'Size', 'Intent Score', 'Top Signal', 'Best Outreach Hook'];
    const rows = leadsToExport.map(l => [
      `"${l.companyName}"`,
      `"${l.domain}"`,
      `"${l.industry}"`,
      `"${l.companySize}"`,
      l.intentScore,
      `"${l.signals[0]?.title || ''}"`,
      `"${l.outreachHooks[0]?.hookText.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `signalpulse_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">High Confidence</span>;
      case 'medium':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Medium Confidence</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">Low Confidence</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Growth & Expansion':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'Executive Movement':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'Tech Stack & Digital Transformation':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'Operational Pain Points':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400/30 animate-bounce">
          <BookmarkCheck className="w-5 h-5" />
          <span className="text-sm font-medium">Lead successfully saved to bookmarks!</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                SignalPulse AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                B2B Intent Agent
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'analyzer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Intent Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'discovery'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Lead Discovery</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'batch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Batch Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 relative ${
                activeTab === 'saved'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Leads</span>
              {savedLeads.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedLeads.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: INTENT ANALYZER */}
        {activeTab === 'analyzer' && (
          <div className="space-y-8">
            {/* Hero input card */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
              
              <div className="max-w-3xl relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                  Uncover Real-Time B2B Buying Signals
                </h1>
                <p className="text-slate-400 text-sm sm:text-base mb-6">
                  Enter any company domain or prospect profile to instantly detect hiring surges, executive movements, tech migrations, and generate hyper-targeted SDR outreach hooks.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeLead()}
                        placeholder="e.g. stripe.com, snowflake.com, datadog.com"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                      />
                    </div>
                    <button
                      onClick={() => analyzeLead()}
                      disabled={loading || !domainInput.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Detect Signals</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optional ICP Context toggle */}
                  <div>
                    <input
                      type="text"
                      value={icpContext}
                      onChange={(e) => setIcpContext(e.target.value)}
                      placeholder="Optional ICP Context (e.g. Selling DevSecOps automation tool to VP of Engineering)"
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-2 flex-wrap pt-2">
                    <span className="text-xs text-slate-500 font-medium">Quick Test Presets:</span>
                    {['stripe.com', 'datadog.com', 'notion.so', 'snowflake.com', 'vercel.com'].map((domain) => (
                      <button
                        key={domain}
                        onClick={() => {
                          setDomainInput(domain);
                          analyzeLead(domain);
                        }}
                        className="px-3 py-1 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700/50 transition-all"
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notice / Fallback Message */}
            {notice && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State Animation */}
            {loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-6">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-white">
                    {loadingStep === 1 && 'Scanning real-time news & funding reports...'}
                    {loadingStep === 2 && 'Detecting executive changes & tech stack signals...'}
                    {loadingStep === 3 && 'Formulating high-conversion SDR outreach hooks...'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Our AI agent is querying live business intelligence and scoring buying propensity.
                  </p>
                </div>
              </div>
            )}

            {/* Lead Intelligence Results */}
            {currentLead && !loading && (
              <div className="space-y-6 animate-fade-in">
                {/* Company Header Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30 shrink-0">
                        {currentLead.companyName.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-2xl font-bold text-white">{currentLead.companyName}</h2>
                          <a
                            href={`https://${currentLead.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20"
                          >
                            <span>{currentLead.domain}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-sm text-slate-400">{currentLead.summary}</p>
                        <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {currentLead.industry}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {currentLead.companySize}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {currentLead.headquarters}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium mb-1">Intent Score</div>
                        <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          {currentLead.intentScore}<span className="text-sm text-slate-500">/100</span>
                        </div>
                      </div>
                      <div className="h-10 w-px bg-slate-800"></div>
                      <button
                        onClick={() => saveLeadToStorage(currentLead)}
                        className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>Save Lead</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Intent Signals Detected */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <span>Detected Buying Signals ({currentLead.signals.length})</span>
                    </h3>
                    <span className="text-xs text-slate-500">Grounded via Real-Time Web Intelligence</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentLead.signals.map((signal, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                {getCategoryIcon(signal.category)}
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {signal.category}
                              </span>
                            </div>
                            {getConfidenceBadge(signal.confidence)}
                          </div>

                          <h4 className="text-base font-bold text-white">{signal.title}</h4>
                          <p className="text-sm text-slate-300 leading-relaxed">{signal.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate max-w-[280px]">Source: {signal.source}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SDR Outreach Hooks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span>Actionable SDR Outreach Hooks</span>
                      </h3>
                      <p className="text-xs text-slate-400">Tailored, non-spammy hooks under 30 words mapped to detected signals.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {currentLead.outreachHooks.map((hook, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {hook.category}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {hook.wordCount} words
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-200">{hook.title}</h4>

                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-sm text-slate-300 leading-relaxed italic">
                            "{hook.hookText}"
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <button
                            onClick={() => copyToClipboard(hook.hookText, idx)}
                            className="w-full bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Hook</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources Footer */}
                {sources.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                    <span className="font-semibold text-slate-300">Grounded Web Citations:</span>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2.5 py-1 rounded-md flex items-center gap-1 truncate max-w-xs transition-all"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate">{src}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LEAD DISCOVERY / ICP FINDER */}
        {activeTab === 'discovery' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="max-w-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">ICP Lead Discovery Agent</h2>
                <p className="text-sm text-slate-400">
                  Select an industry and region to automatically discover fast-growing accounts showing active buying signals right now.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Industry / Sector</label>
                  <select
                    value={discoveryIndustry}
                    onChange={(e) => setDiscoveryIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FinTech & SaaS">FinTech & SaaS</option>
                    <option value="Cybersecurity & GRC">Cybersecurity & GRC</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Healthcare Tech">Healthcare Tech</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="E-Commerce Platforms">E-Commerce Platforms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Region</label>
                  <select
                    value={discoveryRegion}
                    onChange={(e) => setDiscoveryRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="North America">North America</option>
                    <option value="Europe (EMEA)">Europe (EMEA)</option>
                    <option value="Asia Pacific (APAC)">Asia Pacific (APAC)</option>
                    <option value="Global">Global</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={discoverLeads}
                    disabled={discovering}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
                  >
                    {discovering ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Discovering...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Discover Hot Leads</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {discoveredLeads.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Discovered High-Intent Accounts ({discoveredLeads.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {discoveredLeads.map((lead, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Intent: {lead.intentScore}/100
                          </span>
                          <span className="text-xs text-slate-400">{lead.companySize}</span>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-white">{lead.companyName}</h4>
                          <span className="text-xs text-indigo-400">{lead.domain}</span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-3">{lead.summary}</p>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                          <span className="font-semibold text-slate-400">Top Signal:</span>
                          <p className="text-slate-300 font-medium">{lead.signals[0]?.title}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentLead(lead);
                            setActiveTab('analyzer');
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>View Full Intel</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveLeadToStorage(lead)}
                          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 transition-all cursor-pointer"
                          title="Save Lead"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BATCH SCANNER */}
        {activeTab === 'batch' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Batch Domain Intent Scanner</h2>
                <p className="text-sm text-slate-400">
                  Paste multiple target domains (one per line) to analyze intent signals in bulk and export to CSV.
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  rows={5}
                  placeholder="stripe.com&#10;datadog.com&#10;linear.app"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                ></textarea>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {batchInput.split('\n').filter(Boolean).length} domains queued
                  </span>
                  <button
                    onClick={runBatchAnalysis}
                    disabled={batchLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
                  >
                    {batchLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Scanning Batch...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-5 h-5" />
                        <span>Run Batch Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {batchResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Batch Scan Results ({batchResults.length})</h3>
                  <button
                    onClick={() => exportToCSV(batchResults)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export to CSV</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Company</th>
                          <th className="p-4 font-semibold">Industry</th>
                          <th className="p-4 font-semibold">Intent Score</th>
                          <th className="p-4 font-semibold">Top Signal</th>
                          <th className="p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {batchResults.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/50 transition-all">
                            <td className="p-4 font-semibold text-white">
                              <div>{lead.companyName}</div>
                              <div className="text-xs text-indigo-400 font-normal">{lead.domain}</div>
                            </td>
                            <td className="p-4 text-slate-300">{lead.industry}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {lead.intentScore} / 100
                              </span>
                            </td>
                            <td className="p-4 text-slate-300 max-w-xs truncate">
                              {lead.signals[0]?.title || 'N/A'}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  setCurrentLead(lead);
                                  setActiveTab('analyzer');
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                              >
                                <span>Inspect</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED LEADS */}
        {activeTab === 'saved' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Saved Leads ({savedLeads.length})</h2>
                <p className="text-sm text-slate-400">Bookmarked high-intent accounts and generated outreach hooks.</p>
              </div>
              {savedLeads.length > 0 && (
                <button
                  onClick={() => exportToCSV(savedLeads)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {savedLeads.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">No saved leads yet</h3>
                  <p className="text-xs text-slate-400">Analyze companies in the Intent Analyzer and click "Save Lead" to bookmark them here.</p>
                </div>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Start Analyzing Leads</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedLeads.map((lead, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Intent: {lead.intentScore}/100
                        </span>
                        <button
                          onClick={() => removeSavedLead(lead.domain)}
                          className="text-slate-500 hover:text-red-400 transition-all p-1"
                          title="Remove Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white">{lead.companyName}</h3>
                        <span className="text-xs text-indigo-400">{lead.domain} • {lead.industry}</span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2">{lead.summary}</p>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <span className="text-slate-400 font-semibold">Primary Hook:</span>
                        <p className="text-slate-300 italic">"{lead.outreachHooks[0]?.hookText}"</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCurrentLead(lead);
                          setActiveTab('analyzer');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Full Intel & Hooks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">{lead.signals.length} signals detected</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">SP</div>
            <span className="text-slate-400 font-medium">SignalPulse AI B2B Intelligence Platform</span>
          </div>
          <p>© 2026 SignalPulse AI. Powered by Google Gemini & Real-Time Intent Grounding.</p>
        </div>
      </footer>
    </div>
  );
}
