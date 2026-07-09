'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Users,
  CalendarCheck,
  Award,
  CreditCard,
  Wrench,
  Building,
  GraduationCap,
  Briefcase,
  BrainCircuit,
  FileText,
  AlertTriangle,
  FileCheck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  TrendingUp,
  BookOpen,
  LogOut,
  Star,
  Shield,
  BarChart2,
  UserCheck,
  User,
  Mail,
  Phone,
  ChevronRight,
  DollarSign,
  Activity,
  Search
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const positive = ['APPROVED', 'PAID', 'ACTIVE', 'PRESENT', 'OPEN', 'RESOLVED', 'GRANTED', 'FULLY_CLEARED'];
  const warning = ['PENDING', 'PENDING_HR', 'PENDING_HOD', 'PENDING_ADMIN', 'APPLIED', 'SHORTLISTED', 'SCHEDULED', 'DRAFT', 'HOD_REVIEW', 'DEAN_REVIEW', 'HR_REVIEW', 'INITIATED', 'FILED', 'PROCESSED'];
  const danger = ['REJECTED', 'CLOSED', 'CANCELLED', 'TERMINATED', 'RETIRED', 'ABSENT', 'LATE'];

  const cls = positive.includes(status)
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : warning.includes(status)
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : danger.includes(status)
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cls}`}>
      {status?.replace(/_/g, ' ') || 'N/A'}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'blue' }: { label: string; value: any; icon: any; color?: string }) {
  const colors: { [k: string]: string } = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value ?? '—'}</p>
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color] || colors.blue}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message = 'No records found.' }: { message?: string }) {
  return (
    <div className="py-16 text-center text-slate-400">
      <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1 text-slate-300">Run the database seed if you expect data here.</p>
    </div>
  );
}

// ─── Table Wrapper ────────────────────────────────────────────────────────────
function DataTable({ columns, data, renderRow }: { columns: string[]; data: any[]; renderRow: (item: any, idx: number) => React.ReactNode }) {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map(c => (
              <th key={c} className="p-4 font-bold uppercase tracking-wider text-slate-500">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, idx) => renderRow(item, idx))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [extraData, setExtraData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // AI states
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Exit states
  const [exitFacultyId, setExitFacultyId] = useState('');
  const [exitType, setExitType] = useState('RESIGNED');
  const [exitDate, setExitDate] = useState('');
  const [exitReason, setExitReason] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadTabContent(activeTab);
  }, [activeTab, user]);

  const loadTabContent = useCallback(async (tab: string) => {
    setLoading(true);
    setFormSuccess('');
    setFormError('');
    setAiReport('');
    setList([]);
    setStats(null);
    setExtraData(null);

    try {
      // ── Overview ──────────────────────────────────────────────────────
      if (tab === 'overview') {
        if (user!.role === 'HR_MANAGER' || user!.role === 'SUPER_ADMIN' || user!.role === 'DEAN') {
          const [resFacs, resLeaves, resJobs] = await Promise.all([
            apiFetch('/faculty/list'),
            apiFetch('/leave/requests'),
            apiFetch('/recruitment/jobs')
          ]);
          const facData = resFacs.ok ? await resFacs.json() : null;
          const leaveData = resLeaves.ok ? await resLeaves.json() : null;
          const jobData = resJobs.ok ? await resJobs.json() : null;

          setStats({
            facultiesCount: facData?.faculties?.length || 0,
            pendingLeaves: leaveData?.requests?.filter((r: any) => r.status?.includes('PENDING')).length || 0,
            openJobs: jobData?.jobs?.filter((j: any) => j.status === 'OPEN').length || 0,
            activeFaculty: facData?.faculties?.filter((f: any) => f.status === 'ACTIVE').length || 0
          });
          setList(facData?.faculties?.slice(0, 5) || []);
        } else if (user!.role === 'NAAC_COORDINATOR') {
          const res = await apiFetch('/naac/metrics');
          if (res.ok) { const d = await res.json(); setStats(d?.summary); }
        } else if (user!.role === 'ACCOUNTS_OFFICER') {
          const res = await apiFetch('/payroll/stats');
          if (res.ok) { const d = await res.json(); setStats(d); }
        } else {
          // Default: show attendance + leave balances
          const [resAtt, resBal] = await Promise.all([
            apiFetch('/attendance/stats'),
            apiFetch(`/leave/balances?facultyId=${user!.facultyId}`)
          ]);
          const att = resAtt.ok ? await resAtt.json() : null;
          const bal = resBal.ok ? await resBal.json() : null;
          setStats({ attendance: att, balances: bal?.balances });
        }
      }

      // ── Faculty Directory ─────────────────────────────────────────────
      else if (tab === 'faculties') {
        const res = await apiFetch('/faculty/list');
        if (res.ok) { const d = await res.json(); setList(d.faculties || []); }
      }

      // ── Profile ───────────────────────────────────────────────────────
      else if (tab === 'profile') {
        if (user!.facultyId) {
          const res = await apiFetch(`/faculty/profile/${user!.facultyId}`);
          if (res.ok) { const d = await res.json(); setExtraData(d.profile); }
        }
      }

      // ── Leave ─────────────────────────────────────────────────────────
      else if (tab === 'leaves') {
        const [resReq, resBal] = await Promise.all([
          apiFetch('/leave/requests'),
          apiFetch('/leave/balances')
        ]);
        if (resReq.ok) { const d = await resReq.json(); setList(d.requests || []); }
        if (resBal.ok) { const d = await resBal.json(); setExtraData({ balances: d.balances }); }
      }

      // ── Attendance ────────────────────────────────────────────────────
      else if (tab === 'attendance') {
        const [resLogs, resStats] = await Promise.all([
          apiFetch('/attendance/my-logs'),
          apiFetch('/attendance/stats')
        ]);
        if (resLogs.ok) { const d = await resLogs.json(); setList(d.logs || []); }
        if (resStats.ok) { const d = await resStats.json(); setStats(d); }
      }

      // ── Payroll ───────────────────────────────────────────────────────
      else if (tab === 'payroll') {
        const [resHist, resStats] = await Promise.all([
          apiFetch('/payroll/history'),
          apiFetch('/payroll/stats')
        ]);
        if (resHist.ok) { const d = await resHist.json(); setList(d.history || []); }
        if (resStats.ok) { const d = await resStats.json(); setStats(d); }
      }

      // ── My Salary Slips ───────────────────────────────────────────────
      else if (tab === 'slips') {
        const res = await apiFetch('/payroll/history?self=true');
        if (res.ok) { const d = await res.json(); setList(d.history || []); }
      }

      // ── Recruitment ───────────────────────────────────────────────────
      else if (tab === 'recruitment' || tab === 'jobs') {
        const res = await apiFetch('/recruitment/jobs');
        if (res.ok) { const d = await res.json(); setList(d.jobs || []); }
      }

      // ── Candidates ────────────────────────────────────────────────────
      else if (tab === 'candidates') {
        const res = await apiFetch('/recruitment/candidates');
        if (res.ok) { const d = await res.json(); setList(d.candidates || []); }
      }

      // ── Interviews ────────────────────────────────────────────────────
      else if (tab === 'interviews') {
        const res = await apiFetch('/recruitment/interviews');
        if (res.ok) { const d = await res.json(); setList(d.interviews || []); }
      }

      // ── Publications & Patents ────────────────────────────────────────
      else if (tab === 'publications') {
        const [resPub, resPat] = await Promise.all([
          apiFetch('/research/publications?self=true'),
          apiFetch('/research/patents?self=true')
        ]);
        const pubs = resPub.ok ? (await resPub.json()).publications || [] : [];
        const pats = resPat.ok ? (await resPat.json()).patents || [] : [];
        setList(pubs);
        setExtraData({ patents: pats });
      }

      // ── FDP Tracker ───────────────────────────────────────────────────
      else if (tab === 'fdp') {
        const res = await apiFetch('/fdp/list?self=true');
        if (res.ok) { const d = await res.json(); setList(d.records || []); }
      }

      // ── Service Requests ──────────────────────────────────────────────
      else if (tab === 'tickets') {
        const res = await apiFetch('/faculty/service-requests');
        if (res.ok) { const d = await res.json(); setList(d.requests || []); }
      }

      // ── Appraisals ────────────────────────────────────────────────────
      else if (tab === 'appraisal' || tab === 'appraisals') {
        const [resPending, reMy] = await Promise.all([
          apiFetch('/appraisal/pending'),
          apiFetch('/appraisal/my-reviews')
        ]);
        if (resPending.ok) { const d = await resPending.json(); setList(d.appraisals || []); }
        if (reMy.ok) { const d = await reMy.json(); setExtraData({ myAppraisals: d.appraisals || [] }); }
      }

      // ── NAAC Contributions ────────────────────────────────────────────
      else if (tab === 'naac') {
        const res = await apiFetch('/naac/contributions?self=true');
        if (res.ok) { const d = await res.json(); setList(d.contributions || []); }
      }

      // ── NAAC Metrics ──────────────────────────────────────────────────
      else if (tab === 'naac-metrics') {
        const [resMet, resCon] = await Promise.all([
          apiFetch('/naac/metrics'),
          apiFetch('/naac/contributions')
        ]);
        if (resMet.ok) { const d = await resMet.json(); setStats(d?.summary); }
        if (resCon.ok) { const d = await resCon.json(); setList(d.contributions || []); }
      }

      // ── Workload & Roster ─────────────────────────────────────────────
      else if (tab === 'workload') {
        const [resWork, resRoster] = await Promise.all([
          apiFetch('/workload/summary'),
          apiFetch('/workload/roster')
        ]);
        if (resWork.ok) { const d = await resWork.json(); setList(d.workload || []); setStats(d.summary); }
        if (resRoster.ok) { const d = await resRoster.json(); setExtraData({ roster: d.roster || [] }); }
      }

      // ── Departments ───────────────────────────────────────────────────
      else if (tab === 'departments') {
        const res = await apiFetch('/faculty/departments');
        if (res.ok) { const d = await res.json(); setList(d.departments || []); }
      }

      // ── Exit & Clearance ──────────────────────────────────────────────
      else if (tab === 'exits') {
        const [resExits, resStats] = await Promise.all([
          apiFetch('/exit/records'),
          apiFetch('/exit/stats')
        ]);
        if (resExits.ok) { const d = await resExits.json(); setList(d.exits || []); }
        if (resStats.ok) { const d = await resStats.json(); setStats(d.stats); }
      }

      // ── AI Hub ────────────────────────────────────────────────────────
      else if (tab === 'ai-hub') {
        // No initial data load for AI hub - it's on-demand
      }

    } catch (err) {
      console.error('Error loading tab:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Biometric Punch ─────────────────────────────────────────────────────
  const handlePunchAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message} at ${new Date(data.record.punchIn || data.record.punchOut).toLocaleTimeString()}`);
        loadTabContent(activeTab);
      } else {
        alert('❌ ' + (data.error || 'Failed'));
      }
    } catch {
      alert('Error connecting to attendance service');
    }
  };

  // ─── Form Submit ─────────────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    const endpoints: { [k: string]: string } = {
      leave: '/leave/apply',
      publication: '/research/publications',
      fdp: '/fdp/add',
      ticket: '/faculty/service-requests',
      appraisal: '/appraisal/self',
      job: '/recruitment/jobs',
      payroll: '/payroll/process',
      naac: '/naac/add',
      candidate: '/recruitment/apply'
    };

    const endpoint = endpoints[formType];
    if (!endpoint) return;

    try {
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setFormSuccess('Submitted successfully!');
      setFormData({});
      setTimeout(() => {
        setFormOpen(false);
        loadTabContent(activeTab);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  // ─── Decisions ───────────────────────────────────────────────────────────
  const handleDecision = async (type: string, id: string, action: string, comments?: string) => {
    let endpoint = '';
    let body: any = { status: action };

    if (type === 'leave') {
      endpoint = `/leave/requests/${id}/approve`;
      body.remarks = comments;
    } else if (type === 'ticket') {
      endpoint = `/faculty/service-requests/${id}/status`;
      body.comments = comments;
    } else if (type === 'appraisal') {
      endpoint = `/appraisal/review/${id}`;
      body = { rating: parseFloat(action), comments };
    } else if (type === 'candidate') {
      endpoint = `/recruitment/candidates/${id}/status`;
    }

    try {
      const res = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to update');
      } else {
        loadTabContent(activeTab);
      }
    } catch {
      alert('Error updating decision');
    }
  };

  // ─── AI Features ─────────────────────────────────────────────────────────
  const runAiFeature = async (featureName: string) => {
    setAiLoading(true);
    setAiReport('');
    const endpoints: { [k: string]: string } = {
      insights: `/ai/performance-insights/${user?.facultyId || ''}`,
      appraisal: '/ai/appraisal-summary',
      attrition: `/ai/attrition-risk/${user?.facultyId || ''}`,
      workload: '/ai/workload-balancing',
      naac: '/ai/naac-summary',
      anomalies: '/ai/payroll-anomalies'
    };
    try {
      const res = await apiFetch(endpoints[featureName]);
      const data = await res.json();
      if (res.ok) {
        if (featureName === 'attrition') {
          setAiReport(`Risk Score: ${data.riskPercentage}%\n\nStrategies: ${data.report}\n\nRisk Reasons:\n${(data.reasons || []).join('\n')}`);
        } else if (featureName === 'anomalies') {
          setAiReport(`Payroll Anomalies Detected:\n\n${(data.anomalies || []).map((a: any) => `• ${a.facultyName} (${a.month}/${a.year}): ${a.issue} — ${a.details}`).join('\n')}`);
        } else {
          setAiReport(data.insights || data.summary || data.suggestions || data.narrative || JSON.stringify(data, null, 2));
        }
      } else {
        setAiReport(`Failed to run AI analysis. Error: ${data.error || 'Unknown error'}. Ensure OPENAI_API_KEY is set in backend .env`);
      }
    } catch {
      setAiReport('Error connecting to AI service. Backend may not be running.');
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Exit Initiate ───────────────────────────────────────────────────────
  const handleInitiateExit = async () => {
    if (!exitFacultyId || !exitDate) {
      alert('Please select a faculty and last working date');
      return;
    }
    try {
      const res = await apiFetch('/exit/initiate', {
        method: 'POST',
        body: JSON.stringify({ targetFacultyId: exitFacultyId, exitType, lastWorkingDate: exitDate, reason: exitReason })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        loadTabContent('exits');
        setActiveTab('exits');
      } else {
        alert('❌ ' + data.error);
      }
    } catch {
      alert('Error initiating exit');
    }
  };

  const handleClearance = async (facultyId: string, clearanceType: string) => {
    try {
      await apiFetch('/exit/clearance', {
        method: 'PUT',
        body: JSON.stringify({ facultyId, clearanceType, cleared: true })
      });
      loadTabContent('exits');
    } catch {
      alert('Error updating clearance');
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* ════════════════════════════════════════════════
          OVERVIEW
      ════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Hero */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {user.firstName}! 👋</h2>
              <p className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <span className="mt-2 inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30 uppercase">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(user.role === 'DEAN' || user.role === 'HR_MANAGER') && (
                <button
                  onClick={handlePunchAttendance}
                  className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Clock className="h-4 w-4" />
                  Clock In / Out
                </button>
              )}
              {(user.role === 'HR_MANAGER' || user.role === 'SUPER_ADMIN') && (
                <button
                  onClick={() => runAiFeature('anomalies')}
                  className="flex items-center gap-2 bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  <BrainCircuit className="h-4 w-4" />
                  AI Payroll Scan
                </button>
              )}
            </div>
          </div>

          {/* AI Report */}
          {(aiReport || aiLoading) && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 relative">
              {!aiLoading && (
                <button onClick={() => setAiReport('')} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 text-xs font-semibold">✕ Close</button>
              )}
              <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
                <BrainCircuit className="h-5 w-5 text-indigo-600" /> AI Analysis Report
              </h3>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-indigo-600 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> AI is analyzing data...
                </div>
              ) : (
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{aiReport}</pre>
              )}
            </div>
          )}

          {/* HR/DEAN/SUPER_ADMIN Stats */}
          {(user.role === 'HR_MANAGER' || user.role === 'SUPER_ADMIN' || user.role === 'DEAN') && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Active Faculty" value={stats.facultiesCount} icon={Users} color="blue" />
              <StatCard label="Pending Leaves" value={stats.pendingLeaves} icon={CalendarCheck} color="amber" />
              <StatCard label="Open Job Posts" value={stats.openJobs} icon={Briefcase} color="green" />
              <StatCard label="Active Staff" value={stats.activeFaculty} icon={UserCheck} color="purple" />
            </div>
          )}

          {/* NAAC Coordinator Stats */}
          {user.role === 'NAAC_COORDINATOR' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Ph.D. Holders %" value={`${stats.phdPercentage}%`} icon={GraduationCap} color="blue" />
              <StatCard label="Avg Experience" value={`${stats.averageExperienceYears} Yrs`} icon={Award} color="green" />
              <StatCard label="Approved Publications" value={stats.publications?.total} icon={BookOpen} color="purple" />
              <StatCard label="Research Grants" value={`₹${stats.researchGrantsAmount || 0}`} icon={DollarSign} color="amber" />
            </div>
          )}

          {/* Accounts Officer Stats */}
          {user.role === 'ACCOUNTS_OFFICER' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Gross Payout" value={`₹${stats.totalGross || 0}`} icon={CreditCard} color="blue" />
              <StatCard label="Total PF Deductions" value={`₹${stats.totalPF || 0}`} icon={Shield} color="amber" />
              <StatCard label="Total Tax Collected" value={`₹${stats.totalTax || 0}`} icon={BarChart2} color="rose" />
              <StatCard label="Processed Slips" value={stats.totalProcessed} icon={FileCheck} color="green" />
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Feature Launcher */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BrainCircuit className="h-5 w-5 text-indigo-600" /> AI Feature Hub
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.role === 'DEAN' && (
                  <>
                    <button onClick={() => runAiFeature('insights')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Performance Insights</p>
                      <p className="text-slate-500 text-xs mt-1">AI publication & FDP feedback</p>
                    </button>
                    <button onClick={() => runAiFeature('attrition')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Attrition Risk Prediction</p>
                      <p className="text-slate-500 text-xs mt-1">Estimate faculty attrition</p>
                    </button>
                    <button onClick={() => runAiFeature('workload')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all col-span-2 disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Workload Balance Advisor</p>
                      <p className="text-slate-500 text-xs mt-1">Analyze teaching hour distribution</p>
                    </button>
                    <button onClick={() => runAiFeature('naac')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all col-span-2 disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Generate NAAC SSR Narrative</p>
                      <p className="text-slate-500 text-xs mt-1">AI-written accreditation report</p>
                    </button>
                  </>
                )}
                {user.role === 'HR_MANAGER' && (
                  <>
                    <button onClick={() => runAiFeature('workload')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Staff Workload Balance</p>
                      <p className="text-slate-500 text-xs mt-1">Teaching assignment analysis</p>
                    </button>
                    <button onClick={() => runAiFeature('anomalies')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Detect Payroll Anomalies</p>
                      <p className="text-slate-500 text-xs mt-1">Spot salary spike irregularities</p>
                    </button>
                    <button onClick={() => runAiFeature('appraisal')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all col-span-2 disabled:opacity-50">
                      <p className="font-bold text-slate-900 text-xs">Appraisal Cycle Summary</p>
                      <p className="text-slate-500 text-xs mt-1">AI-generated appraisal digest</p>
                    </button>
                  </>
                )}
                {(user.role === 'SUPER_ADMIN') && (
                  <button onClick={() => runAiFeature('anomalies')} disabled={aiLoading} className="text-left p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all col-span-2 disabled:opacity-50">
                    <p className="font-bold text-slate-900 text-xs">Payroll Anomaly Detection</p>
                    <p className="text-slate-500 text-xs mt-1">Scan all payroll records for irregularities</p>
                  </button>
                )}
                {(user.role !== 'DEAN' && user.role !== 'HR_MANAGER' && user.role !== 'SUPER_ADMIN') && (
                  <div className="col-span-2 p-4 text-center text-slate-400 text-xs">
                    AI features are available for DEAN, HR Manager, and Super Admin roles.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck className="h-5 w-5 text-blue-600" /> Quick Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {(user.role === 'DEAN' || user.role === 'HR_MANAGER') && (
                  <>
                    <button onClick={() => { setFormType('leave'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Apply Leave
                    </button>
                    <button onClick={() => { setFormType('publication'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Add Publication
                    </button>
                    <button onClick={() => { setFormType('fdp'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Log FDP
                    </button>
                    <button onClick={() => { setFormType('ticket'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> File Ticket
                    </button>
                    <button onClick={() => { setFormType('appraisal'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Self Appraisal
                    </button>
                  </>
                )}
                {user.role === 'HR_MANAGER' && (
                  <>
                    <button onClick={() => { setFormType('job'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Post Job
                    </button>
                    <button onClick={() => { setFormType('payroll'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Run Payroll
                    </button>
                  </>
                )}
              </div>

              {/* Recent faculty list preview */}
              {list.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Recent Faculty</p>
                  <div className="space-y-2">
                    {list.slice(0, 3).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase text-[10px]">
                          {f.user?.firstName?.[0]}{f.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{f.user?.firstName} {f.user?.lastName}</p>
                          <p className="text-slate-400">{f.designation} · {f.department?.code}</p>
                        </div>
                        <StatusBadge status={f.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          PROFILE
      ════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {loading ? <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading profile...</div> : null}
          {extraData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-lg mb-4">
                  {extraData.user?.firstName?.[0]}{extraData.user?.lastName?.[0]}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{extraData.user?.firstName} {extraData.user?.lastName}</h3>
                <p className="text-sm text-slate-500">{extraData.designation}</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">{extraData.department?.name}</p>
                <StatusBadge status={extraData.status} />
                <div className="mt-4 w-full border-t border-slate-100 pt-4 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{extraData.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{extraData.user?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Joined: {extraData.dateOfJoining ? new Date(extraData.dateOfJoining).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-base text-slate-900 mb-4 border-b border-slate-100 pb-3">Professional Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Gender', value: extraData.gender },
                    { label: 'PAN Number', value: extraData.panNumber || '—' },
                    { label: 'PF Number', value: extraData.pfNumber || '—' },
                    { label: 'Bank Name', value: extraData.bankName || '—' },
                    { label: 'IFSC Code', value: extraData.ifscCode || '—' },
                    { label: 'Basic Pay', value: extraData.basicPay ? `₹${extraData.basicPay.toLocaleString()}` : '—' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase font-semibold">{item.label}</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Qualifications */}
                {extraData.qualifications?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Qualifications</h4>
                    <div className="space-y-2">
                      {extraData.qualifications.map((q: any) => (
                        <div key={q.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{q.degree} in {q.specialization}</p>
                            <p className="text-slate-500">{q.institution} — {q.yearOfPassing}</p>
                          </div>
                          <span className="font-semibold text-blue-600">{q.percentage?.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!loading && !extraData && (
            <EmptyState message="No faculty profile linked to this account. Contact HR to set up your profile." />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          FACULTY DIRECTORY
      ════════════════════════════════════════════════ */}
      {activeTab === 'faculties' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Faculty Directory</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">{list.length} members</span>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />Loading...</div> : (
            <DataTable
              columns={['Faculty', 'Department', 'Designation', 'Status', 'Basic Pay', 'Joined']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm flex-shrink-0">
                        {item.user?.firstName?.[0]}{item.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{item.user?.firstName} {item.user?.lastName}</p>
                        <p className="text-slate-400 text-[10px]">{item.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-600">{item.department?.name}</td>
                  <td className="p-4 text-xs text-slate-600">{item.designation}</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                  <td className="p-4 text-xs font-semibold text-slate-800">₹{item.basicPay?.toLocaleString()}</td>
                  <td className="p-4 text-xs text-slate-500">{item.dateOfJoining ? new Date(item.dateOfJoining).toLocaleDateString() : '—'}</td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          ATTENDANCE
      ════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Present Days" value={stats.present} icon={CheckCircle} color="green" />
              <StatCard label="Late Arrivals" value={stats.late} icon={Clock} color="amber" />
              <StatCard label="Absent Days" value={stats.absent} icon={XCircle} color="rose" />
              <StatCard label="Avg Hours/Day" value={stats.avgHours ? `${stats.avgHours}h` : '—'} icon={Activity} color="blue" />
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Attendance Logs</h3>
              <button onClick={handlePunchAttendance} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Clock className="h-3.5 w-3.5" /> Punch In/Out
              </button>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              <DataTable
                columns={['Date', 'Status', 'Punch In', 'Punch Out', 'Total Hours', 'Source']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-800">{new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                    <td className="p-4 text-xs text-slate-600">{item.punchIn ? new Date(item.punchIn).toLocaleTimeString() : '—'}</td>
                    <td className="p-4 text-xs text-slate-600">{item.punchOut ? new Date(item.punchOut).toLocaleTimeString() : '—'}</td>
                    <td className="p-4 text-xs font-semibold text-slate-800">{item.totalHours ? `${item.totalHours}h` : '—'}</td>
                    <td className="p-4 text-xs text-slate-500">{item.source}</td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          LEAVE MANAGEMENT
      ════════════════════════════════════════════════ */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {/* Leave Balance Cards */}
          {extraData?.balances && extraData.balances.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Your Leave Balances ({new Date().getFullYear()})</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['casualLeave', 'sickLeave', 'earnedLeave', 'dutyLeave', 'maternityLeave'].map(type => {
                  const bal = extraData.balances[0];
                  return bal ? (
                    <div key={type} className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{bal[type]}</p>
                      <p className="text-[10px] text-slate-400 uppercase mt-1 font-semibold">{type.replace('Leave', '').replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Leave Requests</h3>
              <button onClick={() => { setFormType('leave'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Apply Leave
              </button>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              <DataTable
                columns={['Faculty', 'Leave Type', 'Dates', 'Days', 'Status', 'Reason', 'Actions']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-800">{item.faculty?.user?.firstName || user.firstName} {item.faculty?.user?.lastName || user.lastName}</td>
                    <td className="p-4 text-xs text-slate-600">{item.type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-xs text-slate-600">{new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}</td>
                    <td className="p-4 text-xs font-bold text-slate-800">{item.totalDays}d</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                    <td className="p-4 text-xs text-slate-500 max-w-[150px] truncate">{item.reason}</td>
                    <td className="p-4">
                      {user.role === 'HR_MANAGER' && item.status === 'PENDING_HR' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleDecision('leave', item.id, 'APPROVED')} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700">✓ Approve</button>
                          <button onClick={() => handleDecision('leave', item.id, 'REJECTED')} className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700">✕ Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          PAYROLL PROCESSING
      ════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Gross Payout" value={`₹${(stats.totalGross || 0).toLocaleString()}`} icon={CreditCard} color="blue" />
              <StatCard label="PF Deductions" value={`₹${(stats.totalPF || 0).toLocaleString()}`} icon={Shield} color="amber" />
              <StatCard label="Tax Collected" value={`₹${(stats.totalTax || 0).toLocaleString()}`} icon={BarChart2} color="rose" />
              <StatCard label="Processed Slips" value={stats.totalProcessed} icon={FileCheck} color="green" />
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Payroll History</h3>
              {user.role === 'HR_MANAGER' && (
                <button onClick={() => { setFormType('payroll'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  <Play className="h-3.5 w-3.5" /> Run Payroll
                </button>
              )}
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              <DataTable
                columns={['Faculty', 'Period', 'Basic Pay', 'Gross Salary', 'Deductions', 'Net Salary', 'Status']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-800">{item.faculty?.user?.firstName || '—'} {item.faculty?.user?.lastName || ''}</td>
                    <td className="p-4 text-xs text-slate-600">{item.month}/{item.year}</td>
                    <td className="p-4 text-xs text-slate-600">₹{item.basicPay?.toLocaleString()}</td>
                    <td className="p-4 text-xs font-bold text-slate-800">₹{item.grossSalary?.toLocaleString()}</td>
                    <td className="p-4 text-xs text-red-600">-₹{item.totalDeductions?.toLocaleString()}</td>
                    <td className="p-4 text-xs font-bold text-emerald-700">₹{item.netSalary?.toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MY SALARY SLIPS
      ════════════════════════════════════════════════ */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">My Salary Slips</h3>
            <p className="text-xs text-slate-400 mt-1">Your personal payroll records for the year</p>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            list.length === 0 ? <EmptyState message="No salary slips generated yet." /> : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((item: any) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item.month]} {item.year}
                        </p>
                        <p className="text-xs text-slate-400">Salary Slip</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Gross</span><span className="font-semibold">₹{item.grossSalary?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">PF Deduction</span><span className="text-red-500">-₹{item.pfDeduction?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-red-500">-₹{item.taxDeduction?.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5"><span className="font-bold text-slate-800">Net Pay</span><span className="font-bold text-emerald-700">₹{item.netSalary?.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          RECRUITMENT
      ════════════════════════════════════════════════ */}
      {(activeTab === 'recruitment' || activeTab === 'jobs') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Job Openings</h3>
              {user.role === 'HR_MANAGER' && (
                <button onClick={() => { setFormType('job'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Post Job
                </button>
              )}
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              list.length === 0 ? <EmptyState message="No active job postings." /> : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((job: any) => (
                    <div key={job.id} className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${job.status === 'OPEN' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                          <p className="text-xs text-blue-600 font-semibold mt-1">{job.department?.name} · {job.department?.code}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 font-semibold uppercase">
                        <span>Exp: {job.experienceRequired} yrs</span>
                        <span>·</span>
                        <span>{job._count?.candidates || 0} applicants</span>
                        <span>·</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          CANDIDATES
      ════════════════════════════════════════════════ */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Candidate Tracker</h3>
            <p className="text-xs text-slate-400 mt-1">AI-ranked by resume match score</p>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            <DataTable
              columns={['Candidate', 'Applied For', 'Match Score', 'AI Feedback', 'Status', 'Actions']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900 text-xs">{item.firstName} {item.lastName}</p>
                    <p className="text-[10px] text-slate-400">{item.email}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-600">{item.job?.title}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.rankingScore || 0}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{item.rankingScore || 0}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">{item.aiFeedback}</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                  <td className="p-4">
                    {(user.role === 'HR_MANAGER') && item.status === 'APPLIED' && (
                      <button onClick={() => handleDecision('candidate', item.id, 'SHORTLISTED')} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700">Shortlist</button>
                    )}
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          INTERVIEWS
      ════════════════════════════════════════════════ */}
      {activeTab === 'interviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Interview Schedule</h3>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            <DataTable
              columns={['Candidate', 'Job Position', 'Interview Date', 'Mode', 'Status', 'Rating']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-semibold text-xs text-slate-900">{item.candidate?.firstName} {item.candidate?.lastName}</p>
                    <p className="text-[10px] text-slate-400">{item.candidate?.email}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-600">{item.candidate?.job?.title}</td>
                  <td className="p-4 text-xs font-semibold text-slate-800">{item.interviewDate ? new Date(item.interviewDate).toLocaleString() : '—'}</td>
                  <td className="p-4 text-xs text-slate-600">{item.mode}</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                  <td className="p-4 text-xs font-bold text-slate-800">{item.rating ? `${item.rating}/10` : '—'}</td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          PUBLICATIONS & PATENTS
      ════════════════════════════════════════════════ */}
      {activeTab === 'publications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Publications</h3>
              <button onClick={() => { setFormType('publication'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Paper
              </button>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              <DataTable
                columns={['Title', 'Type', 'Journal / Book', 'Year', 'DOI', 'NAAC Criteria', 'Status']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-900 max-w-[200px]">{item.title}</td>
                    <td className="p-4 text-xs text-slate-600">{item.type}</td>
                    <td className="p-4 text-xs text-slate-600 max-w-[150px] truncate">{item.journalBookName}</td>
                    <td className="p-4 text-xs font-semibold text-slate-800">{item.year}</td>
                    <td className="p-4 text-xs text-blue-600">{item.doi || '—'}</td>
                    <td className="p-4 text-xs font-bold text-indigo-700">{item.criteriaNaac || '—'}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )}
              />
            )}
          </div>

          {/* Patents */}
          {extraData?.patents && extraData.patents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Patents</h3>
              </div>
              <DataTable
                columns={['Title', 'Application No.', 'Filing Date', 'Grant Date', 'Status']}
                data={extraData.patents}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-900">{item.title}</td>
                    <td className="p-4 text-xs text-slate-600 font-mono">{item.applicationNumber}</td>
                    <td className="p-4 text-xs text-slate-600">{item.filingDate ? new Date(item.filingDate).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-xs text-slate-600">{item.grantDate ? new Date(item.grantDate).toLocaleDateString() : '—'}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          FDP TRACKER
      ════════════════════════════════════════════════ */}
      {activeTab === 'fdp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Faculty Development Programme (FDP) Tracker</h3>
            <button onClick={() => { setFormType('fdp'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Log FDP
            </button>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            <DataTable
              columns={['Programme Title', 'Type', 'Organization', 'From Date', 'To Date', 'Duration']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-xs font-semibold text-slate-900">{item.title}</td>
                  <td className="p-4 text-xs text-slate-600">{item.type?.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-xs text-slate-600">{item.organization}</td>
                  <td className="p-4 text-xs text-slate-600">{item.fromDate ? new Date(item.fromDate).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-xs text-slate-600">{item.toDate ? new Date(item.toDate).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-xs font-bold text-blue-700">{item.durationDays} days</td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          SERVICE TICKETS
      ════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Employee Service Requests</h3>
            <button onClick={() => { setFormType('ticket'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> New Ticket
            </button>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            <DataTable
              columns={['Faculty', 'Category', 'Description', 'Priority', 'Status', 'Created', 'Actions']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-xs font-semibold text-slate-800">{item.faculty?.user?.firstName || user.firstName} {item.faculty?.user?.lastName || user.lastName}</td>
                  <td className="p-4 text-xs text-slate-600">{item.category?.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">{item.description}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.priority === 'HIGH' ? 'bg-red-50 text-red-600' : item.priority === 'LOW' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                  <td className="p-4 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {(user.role === 'HR_MANAGER' || user.role === 'SUPER_ADMIN') && item.status === 'PENDING_ADMIN' && (
                      <button onClick={() => handleDecision('ticket', item.id, 'RESOLVED', 'Resolved by admin')} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700">Resolve</button>
                    )}
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          APPRAISALS
      ════════════════════════════════════════════════ */}
      {(activeTab === 'appraisal' || activeTab === 'appraisals') && (
        <div className="space-y-4">
          {/* Self Appraisal Form trigger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Performance Appraisal System</h3>
              <p className="text-xs text-slate-400 mt-1">Annual academic performance evaluation cycle 2025–2026</p>
            </div>
            <button onClick={() => { setFormType('appraisal'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Star className="h-3.5 w-3.5" /> Self Appraisal
            </button>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Pending Reviews</h3>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              list.length === 0 ? <EmptyState message="No pending appraisal reviews." /> : (
                <DataTable
                  columns={['Faculty', 'Academic Year', 'Teaching', 'Research', 'FDP', 'Overall Self', 'Status', 'Actions']}
                  data={list}
                  renderRow={(item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-xs font-semibold text-slate-900">{item.faculty?.user?.firstName} {item.faculty?.user?.lastName}</td>
                      <td className="p-4 text-xs text-slate-600">{item.academicYear}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{item.teachingScore?.toFixed(1)}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{item.researchScore?.toFixed(1)}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{item.fdpScore?.toFixed(1)}</td>
                      <td className="p-4 text-xs font-bold text-blue-700">{item.selfRating?.toFixed(1)}/10</td>
                      <td className="p-4"><StatusBadge status={item.status} /></td>
                      <td className="p-4 text-xs">
                        <button onClick={() => { const rating = prompt('Enter your rating (1-10):'); if (rating) handleDecision('appraisal', item.id, rating, 'Reviewed'); }} className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold text-[10px] hover:bg-blue-700">Review</button>
                      </td>
                    </tr>
                  )}
                />
              )
            )}
          </div>

          {/* My Appraisals */}
          {extraData?.myAppraisals && extraData.myAppraisals.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">My Appraisal Records</h3>
              </div>
              <DataTable
                columns={['Academic Year', 'Teaching', 'Research', 'Publications', 'FDP', 'Self Rating', 'HOD Rating', 'Status']}
                data={extraData.myAppraisals}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-bold text-slate-900">{item.academicYear}</td>
                    <td className="p-4 text-xs text-slate-600">{item.teachingScore?.toFixed(1)}</td>
                    <td className="p-4 text-xs text-slate-600">{item.researchScore?.toFixed(1)}</td>
                    <td className="p-4 text-xs text-slate-600">{item.publicationsScore?.toFixed(1)}</td>
                    <td className="p-4 text-xs text-slate-600">{item.fdpScore?.toFixed(1)}</td>
                    <td className="p-4 text-xs font-bold text-blue-700">{item.selfRating?.toFixed(1) || '—'}/10</td>
                    <td className="p-4 text-xs font-bold text-emerald-700">{item.hodRating?.toFixed(1) || '—'}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          NAAC CONTRIBUTIONS
      ════════════════════════════════════════════════ */}
      {activeTab === 'naac' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">NAAC Contributions</h3>
            <button onClick={() => { setFormType('naac'); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Contribution
            </button>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
            <DataTable
              columns={['Title', 'Type', 'Year', 'Value/Amount', 'Status']}
              data={list}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-xs font-semibold text-slate-900">{item.title}</td>
                  <td className="p-4 text-xs text-slate-600">{item.type?.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-xs font-bold text-slate-800">{item.year}</td>
                  <td className="p-4 text-xs text-emerald-700 font-bold">{item.valueAmount ? `₹${item.valueAmount.toLocaleString()}` : '—'}</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                </tr>
              )}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          NAAC METRICS DASHBOARD
      ════════════════════════════════════════════════ */}
      {activeTab === 'naac-metrics' && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Ph.D. Holders %" value={`${stats.phdPercentage || 0}%`} icon={GraduationCap} color="blue" />
              <StatCard label="Avg Experience" value={`${stats.averageExperienceYears || 0} Yrs`} icon={Award} color="green" />
              <StatCard label="Publications" value={stats.publications?.total || 0} icon={BookOpen} color="purple" />
              <StatCard label="Research Grants" value={`₹${(stats.researchGrantsAmount || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-indigo-600" /> AI NAAC Narrative Generator</h3>
              <p className="text-xs text-slate-500 mb-4">Generate an AI-written Self-Study Report (SSR) narrative using live faculty data and research metrics.</p>
              <button onClick={() => runAiFeature('naac')} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Generate SSR Report
              </button>
              {aiReport && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{aiReport}</pre>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-4">Accreditation Key Criteria</h3>
              {[
                { code: '3.4.2', title: 'Ph.D. Faculty Ratio', value: `${stats?.phdPercentage || 0}%`, target: '40%' },
                { code: '3.4.4', title: 'Journal Publications', value: stats?.publications?.journals || 0, target: '5/dept' },
                { code: '3.4.5', title: 'Conference Papers', value: stats?.publications?.conferences || 0, target: '3/dept' },
                { code: '3.2.1', title: 'Research Grants', value: `₹${(stats?.researchGrantsAmount || 0).toLocaleString()}`, target: '₹1L/yr' },
                { code: '6.3.4', title: 'FDP Attendance', value: stats?.fdpCount || 0, target: '2/faculty' }
              ].map(c => (
                <div key={c.code} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                    <span className="text-xs text-slate-700 ml-2">{c.title}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{c.value}</p>
                    <p className="text-[10px] text-slate-400">Target: {c.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All NAAC Contributions Table */}
          {list.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">All NAAC Contributions</h3>
              </div>
              <DataTable
                columns={['Faculty', 'Title', 'Type', 'Year', 'Amount', 'Status']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-semibold text-slate-900">{item.faculty?.user?.firstName} {item.faculty?.user?.lastName}</td>
                    <td className="p-4 text-xs text-slate-700">{item.title}</td>
                    <td className="p-4 text-xs text-slate-500">{item.type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-xs font-bold text-slate-800">{item.year}</td>
                    <td className="p-4 text-xs text-emerald-700 font-bold">{item.valueAmount ? `₹${item.valueAmount.toLocaleString()}` : '—'}</td>
                    <td className="p-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          WORKLOAD & ROSTER
      ════════════════════════════════════════════════ */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Faculty" value={stats.totalFaculty} icon={Users} color="blue" />
              <StatCard label="Overloaded" value={stats.overloaded} icon={AlertTriangle} color="rose" />
              <StatCard label="Underloaded" value={stats.underloaded} icon={TrendingUp} color="amber" />
              <StatCard label="Avg Hrs/Week" value={`${stats.avgHoursPerWeek}h`} icon={Clock} color="green" />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Teaching Workload by Faculty</h3>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              <DataTable
                columns={['Faculty', 'Department', 'Designation', 'Hours/Week', 'Workload', 'Subjects', 'FDP Count', 'Status']}
                data={list}
                renderRow={(item) => (
                  <tr key={item.id} className={`hover:bg-slate-50/50 ${item.isOverloaded ? 'bg-red-50/20' : ''}`}>
                    <td className="p-4">
                      <p className="text-xs font-semibold text-slate-900">{item.facultyName}</p>
                      <p className="text-[10px] text-slate-400">{item.email}</p>
                    </td>
                    <td className="p-4 text-xs text-slate-600">{item.departmentCode}</td>
                    <td className="p-4 text-xs text-slate-600">{item.designation}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold ${item.isOverloaded ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.teachingHoursPerWeek}h
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 w-20">
                          <div className={`h-2 rounded-full ${item.workloadScore > 90 ? 'bg-red-500' : item.workloadScore > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${item.workloadScore}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{item.workloadScore}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-600">{item.subjects?.length} subjects</td>
                    <td className="p-4 text-xs font-bold text-indigo-700">{item.fdpAttendedThisYear}</td>
                    <td className="p-4">
                      {item.isOverloaded ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠ OVERLOADED</span>
                      ) : item.onLeaveThisMonth ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">ON LEAVE</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">NORMAL</span>
                      )}
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DEPARTMENTS
      ════════════════════════════════════════════════ */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div>
            ) : list.length === 0 ? (
              <div className="col-span-3"><EmptyState message="No departments found." /></div>
            ) : (
              list.map((dept: any) => (
                <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center justify-center text-xs border border-blue-100">
                      {dept.code}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{dept.faculties?.length || 0} Faculty</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                  {dept.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dept.description}</p>}
                  {dept.hod && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold uppercase">
                        {dept.hod?.user?.firstName?.[0]}
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400">HOD: </span>
                        <span className="font-semibold text-slate-700">{dept.hod?.user?.firstName} {dept.hod?.user?.lastName}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          EXIT & CLEARANCE MANAGEMENT
      ════════════════════════════════════════════════ */}
      {activeTab === 'exits' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Active Staff" value={stats.active} icon={UserCheck} color="green" />
              <StatCard label="Terminated" value={stats.terminated} icon={XCircle} color="rose" />
              <StatCard label="Retired" value={stats.retired} icon={LogOut} color="amber" />
              <StatCard label="Total Headcount" value={stats.total} icon={Users} color="blue" />
            </div>
          )}

          {/* Initiate Exit Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <LogOut className="h-5 w-5 text-rose-600" /> Initiate Exit Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Faculty</label>
                <select
                  value={exitFacultyId}
                  onChange={e => setExitFacultyId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Select Faculty --</option>
                  {/* We'll populate from a separate call if needed */}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Exit Type</label>
                <select
                  value={exitType}
                  onChange={e => setExitType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="RESIGNED">Resignation</option>
                  <option value="RETIRED">Retirement</option>
                  <option value="TERMINATED">Termination</option>
                  <option value="CONTRACT_END">Contract End</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Working Date</label>
                <input
                  type="date"
                  value={exitDate}
                  onChange={e => setExitDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleInitiateExit}
                  className="w-full px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  Initiate Exit
                </button>
              </div>
            </div>
          </div>

          {/* Exit Records */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Exit Records & Clearance Status</h3>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /></div> : (
              list.length === 0 ? <EmptyState message="No exit records found. Initiate an exit process above." /> : (
                <div className="p-5 space-y-4">
                  {list.map((item: any) => (
                    <div key={item.id} className="border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.department} · {item.designation}</p>
                          <p className="text-xs text-slate-400">{item.email}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.exitData && (
                        <div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { key: 'hod', label: 'HOD Clearance' },
                              { key: 'library', label: 'Library' },
                              { key: 'accounts', label: 'Accounts' },
                              { key: 'it', label: 'IT Assets' },
                              { key: 'hr', label: 'HR Sign-off' }
                            ].map(c => (
                              <div key={c.key} className={`p-2 rounded-xl text-center text-xs font-semibold border ${item.exitData.clearances?.[c.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <p>{item.exitData.clearances?.[c.key] ? '✓' : '○'} {c.label}</p>
                                {!item.exitData.clearances?.[c.key] && (
                                  <button onClick={() => handleClearance(item.id, c.key)} className="mt-1 text-[9px] underline text-blue-600">Mark cleared</button>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500">
                            Exit Type: <span className="font-semibold text-slate-700">{item.exitData.exitType}</span> ·
                            Last Day: <span className="font-semibold text-slate-700">{item.exitData.lastWorkingDate}</span> ·
                            Status: <StatusBadge status={item.exitData.status || 'INITIATED'} />
                          </div>
                        </div>
                      )}
                      {!item.exitData && <p className="text-xs text-slate-400 italic">Exit process data unavailable</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          AI HUB (Full page)
      ════════════════════════════════════════════════ */}
      {activeTab === 'ai-hub' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold flex items-center gap-2"><BrainCircuit className="h-6 w-6" /> AI Decision Hub</h2>
            <p className="text-indigo-200 text-sm mt-1">Powered by AI — Analyze faculty performance, predict attrition, detect anomalies, and generate NAAC reports.</p>
          </div>

          {aiReport && (
            <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm relative">
              <button onClick={() => setAiReport('')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Close</button>
              <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3"><BrainCircuit className="h-4 w-4 text-indigo-600" /> AI Output</h3>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{aiReport}</pre>
            </div>
          )}

          {aiLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> AI is reasoning over database records...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'insights', icon: Star, title: 'Performance Insights', desc: 'Deep-dive AI insights on faculty publications, research output, FDP participation, and student feedback.', roles: ['DEAN', 'HR_MANAGER', 'SUPER_ADMIN'] },
              { key: 'attrition', icon: TrendingUp, title: 'Attrition Risk Prediction', desc: 'Estimate the probability of each faculty member leaving the institution in the next 12 months.', roles: ['DEAN', 'HR_MANAGER', 'SUPER_ADMIN'] },
              { key: 'workload', icon: BarChart2, title: 'Workload Balancing Advisor', desc: 'Analyze teaching hour distribution across departments and receive AI optimization suggestions.', roles: ['DEAN', 'HR_MANAGER', 'SUPER_ADMIN'] },
              { key: 'naac', icon: GraduationCap, title: 'NAAC SSR Narrative Generator', desc: 'Generate a complete AI-written Self-Study Report narrative based on live faculty data and metrics.', roles: ['DEAN', 'NAAC_COORDINATOR', 'SUPER_ADMIN'] },
              { key: 'appraisal', icon: Award, title: 'Appraisal Cycle Summary', desc: 'AI-generated summary of the annual appraisal cycle with highlights and recommendations.', roles: ['HR_MANAGER', 'SUPER_ADMIN'] },
              { key: 'anomalies', icon: AlertTriangle, title: 'Payroll Anomaly Detection', desc: 'Scan all payroll records for unusual salary spikes, incorrect deductions, or tax calculation errors.', roles: ['HR_MANAGER', 'ACCOUNTS_OFFICER', 'SUPER_ADMIN'] },
            ].filter(f => f.roles.includes(user.role)).map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border border-indigo-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{feature.desc}</p>
                  <button
                    onClick={() => runAiFeature(feature.key)}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Run AI Analysis
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          FORMS MODAL
      ════════════════════════════════════════════════ */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors">✕</button>
            <h3 className="font-bold text-lg text-slate-950 mb-4 capitalize">{formType.replace(/_/g, ' ')} Form</h3>

            {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold mb-3">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold mb-3">✓ {formSuccess}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">

              {/* ── LEAVE FORM ── */}
              {formType === 'leave' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Leave Type</label>
                    <select onChange={e => setFormData({ ...formData, type: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="">Select type</option>
                      <option value="CASUAL_LEAVE">Casual Leave</option>
                      <option value="SICK_LEAVE">Sick Leave</option>
                      <option value="EARNED_LEAVE">Earned Leave</option>
                      <option value="DUTY_LEAVE">Duty Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Start Date</label>
                      <input type="date" onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">End Date</label>
                      <input type="date" onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Reason</label>
                    <textarea onChange={e => setFormData({ ...formData, reason: e.target.value })} required rows={3} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Reason for leave..." />
                  </div>
                </>
              )}

              {/* ── PUBLICATION FORM ── */}
              {formType === 'publication' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Publication Type</label>
                    <select onChange={e => setFormData({ ...formData, type: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="JOURNAL">Journal</option>
                      <option value="CONFERENCE">Conference</option>
                      <option value="BOOK">Book</option>
                      <option value="BOOK_CHAPTER">Book Chapter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Paper Title</label>
                    <input type="text" onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Full paper title..." />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Journal / Book Name</label>
                    <input type="text" onChange={e => setFormData({ ...formData, journalBookName: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="IEEE Transactions..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Year</label>
                      <input type="number" defaultValue={new Date().getFullYear()} onChange={e => setFormData({ ...formData, year: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">DOI (optional)</label>
                      <input type="text" onChange={e => setFormData({ ...formData, doi: e.target.value })} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="10.xxxx/..." />
                    </div>
                  </div>
                </>
              )}

              {/* ── FDP FORM ── */}
              {formType === 'fdp' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Programme Title</label>
                    <input type="text" onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Workshop / FDP Title" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Type</label>
                    <select onChange={e => setFormData({ ...formData, type: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="FDP">FDP</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="CERTIFICATION">Certification</option>
                      <option value="INDUSTRIAL_TRAINING">Industrial Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Organizing Institution</label>
                    <input type="text" onChange={e => setFormData({ ...formData, organization: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="IIT Delhi / AICTE..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">From</label>
                      <input type="date" onChange={e => setFormData({ ...formData, fromDate: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">To</label>
                      <input type="date" onChange={e => setFormData({ ...formData, toDate: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Days</label>
                      <input type="number" onChange={e => setFormData({ ...formData, durationDays: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="5" />
                    </div>
                  </div>
                </>
              )}

              {/* ── TICKET FORM ── */}
              {formType === 'ticket' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Category</label>
                    <select onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="IT_SUPPORT">IT Support</option>
                      <option value="ID_CARD">ID Card Request</option>
                      <option value="EQUIPMENT">Equipment Allocation</option>
                      <option value="INFRASTRUCTURE_SUPPORT">Infrastructure Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Priority</label>
                    <select onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Description</label>
                    <textarea onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={4} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Describe the issue..." />
                  </div>
                </>
              )}

              {/* ── APPRAISAL FORM ── */}
              {formType === 'appraisal' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Academic Year</label>
                    <input type="text" defaultValue="2025-2026" onChange={e => setFormData({ ...formData, academicYear: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  {['teachingScore', 'researchScore', 'publicationsScore', 'feedbackScore', 'fdpScore'].map(field => (
                    <div key={field}>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">{field.replace('Score', '').replace(/([A-Z])/g, ' $1')} Score (1–10)</label>
                      <input type="number" min="1" max="10" step="0.1" onChange={e => setFormData({ ...formData, [field]: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Self Rating (1–10)</label>
                    <input type="number" min="1" max="10" step="0.1" onChange={e => setFormData({ ...formData, selfRating: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Self Comments</label>
                    <textarea onChange={e => setFormData({ ...formData, selfComments: e.target.value })} rows={3} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Your remarks on your performance..." />
                  </div>
                </>
              )}

              {/* ── JOB FORM ── */}
              {formType === 'job' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Job Title</label>
                    <input type="text" onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Assistant Professor in CSE..." />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Department ID</label>
                    <input type="text" onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Paste department UUID from backend" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Description</label>
                    <textarea onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={3} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Requirements</label>
                    <textarea onChange={e => setFormData({ ...formData, requirements: e.target.value })} required rows={2} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Ph.D. preferred, 3+ years..." />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Experience Required (years)</label>
                    <input type="number" onChange={e => setFormData({ ...formData, experienceRequired: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                </>
              )}

              {/* ── PAYROLL FORM ── */}
              {formType === 'payroll' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Month (1–12)</label>
                      <input type="number" min="1" max="12" onChange={e => setFormData({ ...formData, month: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Year</label>
                      <input type="number" defaultValue={new Date().getFullYear()} onChange={e => setFormData({ ...formData, year: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                  </div>
                </>
              )}

              {/* ── NAAC CONTRIBUTION FORM ── */}
              {formType === 'naac' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Contribution Type</label>
                    <select onChange={e => setFormData({ ...formData, type: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="PUBLICATION">Publication</option>
                      <option value="FDP">FDP Participation</option>
                      <option value="STUDENT_MENTORING">Student Mentoring</option>
                      <option value="RESEARCH_GRANT">Research Grant</option>
                      <option value="CONSULTANCY">Consultancy</option>
                      <option value="EXTENSION_ACTIVITY">Extension Activity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Title</label>
                    <input type="text" onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Description</label>
                    <textarea onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Year</label>
                      <input type="number" defaultValue={new Date().getFullYear()} onChange={e => setFormData({ ...formData, year: e.target.value })} required className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-600 uppercase">Value Amount (₹)</label>
                      <input type="number" onChange={e => setFormData({ ...formData, valueAmount: e.target.value })} className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Optional" />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-semibold transition-colors">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// Calendar icon (not in initial imports)
function Calendar({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
