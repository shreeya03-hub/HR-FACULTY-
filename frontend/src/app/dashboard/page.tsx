'use client';

import React, { useState, useEffect } from 'react';
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
  Play
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Business state
  const [stats, setStats] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [extraData, setExtraData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // AI results
  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadTabContent(activeTab);
  }, [activeTab, user]);

  const loadTabContent = async (tab: string) => {
    setLoading(true);
    setFormSuccess('');
    setFormError('');
    setAiReport('');

    try {
      if (tab === 'overview') {
        // Load general overview depending on role
        if (user!.role === 'FACULTY') {
          const resBalances = await apiFetch(`/leave/balances?facultyId=${user!.facultyId}`);
          const balances = resBalances.ok ? await resBalances.json() : null;
          
          const resAttendance = await apiFetch('/attendance/stats');
          const attStats = resAttendance.ok ? await resAttendance.json() : null;

          setStats({ balances: balances?.balances, attendance: attStats });
        } else if (user!.role === 'HR_MANAGER' || user!.role === 'PRINCIPAL' || user!.role === 'DEAN') {
          const resFaculties = await apiFetch('/faculty/list');
          const dataFacs = resFaculties.ok ? await resFaculties.json() : null;
          
          const resLeaves = await apiFetch('/leave/requests');
          const dataLeaves = resLeaves.ok ? await resLeaves.json() : null;

          const resJobs = await apiFetch('/recruitment/jobs');
          const dataJobs = resJobs.ok ? await resJobs.json() : null;

          setStats({
            facultiesCount: dataFacs?.faculties?.length || 0,
            pendingLeaves: dataLeaves?.requests?.filter((r: any) => r.status.includes('PENDING')).length || 0,
            openJobs: dataJobs?.jobs?.filter((j: any) => j.status === 'OPEN').length || 0
          });
          setList(dataFacs?.faculties || []);
        } else if (user!.role === 'NAAC_COORDINATOR') {
          const resMetrics = await apiFetch('/naac/metrics');
          const metrics = resMetrics.ok ? await resMetrics.json() : null;
          setStats(metrics?.summary);
        } else if (user!.role === 'ACCOUNTS_OFFICER') {
          const resPayStats = await apiFetch('/payroll/stats');
          const payStats = resPayStats.ok ? await resPayStats.json() : null;
          setStats(payStats);
        } else if (user!.role === 'HOD') {
          const resLeaves = await apiFetch('/leave/requests');
          const leaves = resLeaves.ok ? await resLeaves.json() : [];
          setList(leaves.requests || []);
        }
      } else if (tab === 'faculties') {
        const res = await apiFetch('/faculty/list');
        if (res.ok) {
          const data = await res.json();
          setList(data.faculties);
        }
      } else if (tab === 'leaves') {
        const res = await apiFetch('/leave/requests');
        if (res.ok) {
          const data = await res.json();
          setList(data.requests);
        }
        const balRes = await apiFetch('/leave/balances');
        if (balRes.ok) {
          const balData = await balRes.json();
          setExtraData({ balances: balData.balances });
        }
      } else if (tab === 'payroll') {
        const res = await apiFetch('/payroll/history');
        if (res.ok) {
          const data = await res.json();
          setList(data.history);
        }
      } else if (tab === 'slips') {
        const res = await apiFetch('/payroll/history?self=true');
        if (res.ok) {
          const data = await res.json();
          setList(data.history);
        }
      } else if (tab === 'recruitment' || tab === 'jobs') {
        const res = await apiFetch('/recruitment/jobs');
        if (res.ok) {
          const data = await res.json();
          setList(data.jobs);
        }
      } else if (tab === 'candidates') {
        const res = await apiFetch('/recruitment/candidates');
        if (res.ok) {
          const data = await res.json();
          setList(data.candidates);
        }
      } else if (tab === 'interviews') {
        const res = await apiFetch('/recruitment/interviews');
        if (res.ok) {
          const data = await res.json();
          setList(data.interviews);
        }
      } else if (tab === 'publications') {
        const res = await apiFetch('/research/publications?self=true');
        if (res.ok) {
          const data = await res.json();
          setList(data.publications);
        }
      } else if (tab === 'fdp') {
        const res = await apiFetch('/fdp/list?self=true');
        if (res.ok) {
          const data = await res.json();
          setList(data.records);
        }
      } else if (tab === 'tickets') {
        const res = await apiFetch('/faculty/service-requests');
        if (res.ok) {
          const data = await res.json();
          setList(data.requests);
        }
      } else if (tab === 'naac-metrics') {
        const resMetrics = await apiFetch('/naac/metrics');
        const metrics = resMetrics.ok ? await resMetrics.json() : null;
        setStats(metrics?.summary);

        const resContrib = await apiFetch('/naac/contributions');
        if (resContrib.ok) {
          const contribData = await resContrib.json();
          setList(contribData.contributions);
        }
      } else if (tab === 'naac') {
        const resContrib = await apiFetch('/naac/contributions?self=true');
        if (resContrib.ok) {
          const contribData = await resContrib.json();
          setList(contribData.contributions);
        }
      } else if (tab === 'appraisal' || tab === 'appraisals') {
        const res = await apiFetch('/appraisal/pending');
        const pendingData = res.ok ? await res.json() : null;
        
        const myRes = await apiFetch('/appraisal/my-reviews');
        const myData = myRes.ok ? await myRes.json() : null;

        setList(pendingData?.appraisals || []);
        setExtraData({ myAppraisals: myData?.appraisals || [] });
      } else if (tab === 'attendance') {
        const res = await apiFetch('/attendance/my-logs');
        if (res.ok) {
          const data = await res.json();
          setList(data.logs);
        }
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Biometric punch simulator
  const handlePunchAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.message}: ${new Date(data.record.punchIn || data.record.punchOut).toLocaleTimeString()}`);
        loadTabContent(activeTab);
      } else {
        alert(data.error || 'Failed to punch attendance');
      }
    } catch (err) {
      alert('Error connecting to biometric service');
    }
  };

  // Submit forms
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    let endpoint = '';
    let method = 'POST';

    if (formType === 'leave') {
      endpoint = '/leave/apply';
    } else if (formType === 'publication') {
      endpoint = '/research/publications';
    } else if (formType === 'fdp') {
      endpoint = '/fdp/add';
    } else if (formType === 'ticket') {
      endpoint = '/faculty/service-requests';
    } else if (formType === 'appraisal') {
      endpoint = '/appraisal/self';
    } else if (formType === 'job') {
      endpoint = '/recruitment/jobs';
    } else if (formType === 'payroll') {
      endpoint = '/payroll/process';
    } else if (formType === 'candidate') {
      endpoint = '/recruitment/apply';
      method = 'POST'; // Public application
    }

    try {
      const body = formType === 'candidate' 
        ? JSON.stringify(formData) 
        : JSON.stringify(formData);

      const res = await apiFetch(endpoint, {
        method,
        body
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setFormSuccess('Successfully submitted!');
      setFormData({});
      setTimeout(() => {
        setFormOpen(false);
        loadTabContent(activeTab);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  // HOD/HR Decisions (Leaves, Tickets, Appraisals)
  const handleDecision = async (type: string, id: string, action: string, comments?: string) => {
    let endpoint = '';
    let method = 'PUT';
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
    }

    try {
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update record');
      } else {
        loadTabContent(activeTab);
      }
    } catch (err) {
      alert('Error updating decision');
    }
  };

  // Run AI operations
  const runAiFeature = async (featureName: string, param?: string) => {
    setAiLoading(true);
    setAiReport('');
    try {
      let endpoint = '';
      if (featureName === 'insights') {
        endpoint = `/ai/performance-insights/${param || user?.facultyId}`;
      } else if (featureName === 'appraisal') {
        endpoint = '/ai/appraisal-summary';
      } else if (featureName === 'attrition') {
        endpoint = `/ai/attrition-risk/${param || user?.facultyId}`;
      } else if (featureName === 'workload') {
        endpoint = '/ai/workload-balancing';
      } else if (featureName === 'naac') {
        endpoint = '/ai/naac-summary';
      } else if (featureName === 'anomalies') {
        endpoint = '/ai/payroll-anomalies';
      }

      const res = await apiFetch(endpoint);
      const data = await res.json();
      
      if (res.ok) {
        if (featureName === 'insights') setAiReport(data.insights);
        else if (featureName === 'appraisal') setAiReport(data.summary);
        else if (featureName === 'attrition') setAiReport(`Risk: ${data.riskPercentage}% \n\nStrategy: ${data.report}\n\nReasons:\n${data.reasons.join('\n')}`);
        else if (featureName === 'workload') setAiReport(data.suggestions);
        else if (featureName === 'naac') setAiReport(data.narrative);
        else if (featureName === 'anomalies') {
          const list = data.anomalies.map((a: any) => `* ${a.facultyName} (${a.month}/${a.year}): ${a.issue} - ${a.details}`).join('\n');
          setAiReport(`### Payroll Anomaly Detection Report\n\n${list}`);
        }
      } else {
        setAiReport('Failed to fetch AI feedback. Ensure backend is running.');
      }
    } catch (err) {
      setAiReport('Error connecting to AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* 1. OVERVIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back, {user?.firstName}!</h2>
              <p className="text-sm text-slate-500">Department portal context initialized. View quick stats below.</p>
            </div>
            
            {/* Faculty attendance puncher shortcut */}
            {(user?.role === 'DEAN' || user?.role === 'HR_MANAGER') && (
              <div className="flex gap-2">
                <button 
                  onClick={handlePunchAttendance}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Clock className="h-4 w-4" />
                  Clock In/Out Simulator
                </button>
              </div>
            )}

            {/* Principal/Dean/HR Anomaly Scanner advice */}
            {(user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN') && (
              <button 
                onClick={() => runAiFeature('anomalies')}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                <BrainCircuit className="h-4 w-4" />
                Scan Payroll Anomalies (AI)
              </button>
            )}
          </div>

          {/* AI report popup drawer */}
          {aiReport && (
            <div className="bg-blue-50/50 border border-blue-200 p-6 rounded-2xl text-slate-800 text-sm whitespace-pre-wrap relative animate-fade-in-down">
              <button 
                onClick={() => setAiReport('')} 
                className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Close (x)
              </button>
              <h3 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                AI Analysis Report
              </h3>
              {aiReport}
            </div>
          )}

          {/* AI Loader */}
          {aiLoading && (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 font-medium bg-white rounded-2xl border border-slate-200">
              <LoaderIcon className="animate-spin h-5 w-5 text-blue-600" />
              AI is reasoning over database records...
            </div>
          )}

          {/* Statistics Dashlets based on Role */}
          {/* HR/PRINCIPAL STATS */}
          {(user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'DEAN') && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Faculty Staff</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.facultiesCount}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Leave Files</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingLeaves}</p>
                </div>
                <CalendarCheck className="h-10 w-10 text-blue-600" />
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Job Postings</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.openJobs}</p>
                </div>
                <Briefcase className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          )}

          {/* NAAC STATS */}
          {user?.role === 'NAAC_COORDINATOR' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ph.D holders ratio</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.phdPercentage}%</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mean Exp Years</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.averageExperienceYears} Yrs</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Publications</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.publications?.total || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grants Collected</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">${stats.researchGrantsAmount || 0}</p>
              </div>
            </div>
          )}

          {/* ACCOUNTS STATS */}
          {user?.role === 'ACCOUNTS_OFFICER' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Payout</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">${stats.totalGross || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total PF Deductions</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">${stats.totalPF || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tax Collected</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">${stats.totalTax || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processed Slips</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalProcessed}</p>
              </div>
            </div>
          )}

          {/* Quick links & shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Action hub */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                AI Feature Launcher
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user?.role === 'DEAN' && (
                  <>
                    <button onClick={() => runAiFeature('insights')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <p className="font-bold text-slate-900">Performance Insights</p>
                      <p className="text-slate-500 mt-1">Check publication and FDP feedback suggestions.</p>
                    </button>
                    <button onClick={() => runAiFeature('attrition')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <p className="font-bold text-slate-900">Predict Attrition Risk</p>
                      <p className="text-slate-500 mt-1">Estimate personal attrition risk indicators.</p>
                    </button>
                    <button onClick={() => runAiFeature('workload')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors col-span-2">
                      <p className="font-bold text-slate-900">Balance Department Workload</p>
                      <p className="text-slate-500 mt-1">Analyze teaching assignments and balance hours.</p>
                    </button>
                    <button onClick={() => runAiFeature('naac')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors col-span-2">
                      <p className="font-bold text-slate-900">Generate Narrative SSR Report</p>
                      <p className="text-slate-500 mt-1">Produce academic summaries based on metrics.</p>
                    </button>
                  </>
                )}

                {user?.role === 'HR_MANAGER' && (
                  <>
                    <button onClick={() => runAiFeature('workload')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <p className="font-bold text-slate-900">Staff Workload Balance</p>
                      <p className="text-slate-500 mt-1">Check class assignments suggestions.</p>
                    </button>
                    <button onClick={() => runAiFeature('anomalies')} className="text-left text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <p className="font-bold text-slate-900">Detect Payroll Anomalies</p>
                      <p className="text-slate-500 mt-1">Identify salary spikes or PF tax issues.</p>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Quick Action Center
              </h3>
              <div className="flex flex-wrap gap-2">
                {user?.role === 'DEAN' && (
                  <>
                    <button onClick={() => { setFormType('leave'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Apply for Leave
                    </button>
                    <button onClick={() => { setFormType('publication'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Add Publication
                    </button>
                    <button onClick={() => { setFormType('fdp'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Log FDP Workshop
                    </button>
                    <button onClick={() => { setFormType('ticket'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> File Support Ticket
                    </button>
                    <button onClick={() => { setFormType('appraisal'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Self Appraisal
                    </button>
                  </>
                )}

                {user?.role === 'HR_MANAGER' && (
                  <>
                    <button onClick={() => { setFormType('leave'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Apply for Leave
                    </button>
                    <button onClick={() => { setFormType('job'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Post New Job
                    </button>
                    <button onClick={() => { setFormType('payroll'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Run Payroll process
                    </button>
                    <button onClick={() => { setFormType('ticket'); setFormOpen(true); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> File Support Ticket
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC BUSINESS TABLES LIST PANELS */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 capitalize">{activeTab.replace('-', ' ')} list</h3>
            
            {/* Filter buttons dynamically matching role tab configurations */}
            {activeTab === 'publications' && user?.role === 'DEAN' && (
              <button 
                onClick={() => { setFormType('publication'); setFormOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Paper
              </button>
            )}
            {activeTab === 'leaves' && user?.role === 'DEAN' && (
              <button 
                onClick={() => { setFormType('leave'); setFormOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Apply Leave
              </button>
            )}
            {activeTab === 'tickets' && (user?.role === 'DEAN' || user?.role === 'HR_MANAGER') && (
              <button 
                onClick={() => { setFormType('ticket'); setFormOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Create Ticket
              </button>
            )}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 text-center text-slate-500">Loading details...</div>
          )}

          {/* List display */}
          {!loading && list.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">No records found. Try running simulated triggers first.</div>
          )}

          {!loading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-4 font-bold uppercase tracking-wider">Record Detail</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Identifiers</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Action Date</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      {/* Detailed info dynamic blocks depending on tab */}
                      <td className="p-4">
                        {activeTab === 'faculties' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.user?.firstName} {item.user?.lastName}</p>
                            <p className="text-slate-500">{item.designation} - {item.department?.name}</p>
                          </div>
                        )}
                        {activeTab === 'leaves' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.faculty?.user?.firstName || 'My'} {item.faculty?.user?.lastName || 'Leave'}</p>
                            <p className="text-slate-500">{item.type} ({item.totalDays} Days) - {item.reason}</p>
                          </div>
                        )}
                        {activeTab === 'publications' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="text-slate-500">{item.type} - {item.journalBookName} ({item.year})</p>
                          </div>
                        )}
                        {activeTab === 'payroll' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.faculty?.user?.firstName || 'Faculty'} Salary File</p>
                            <p className="text-slate-500">Gross: ${item.grossSalary} | TDS: ${item.taxDeduction} | Net: ${item.netSalary}</p>
                          </div>
                        )}
                        {activeTab === 'jobs' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="text-slate-500">Exp required: {item.experienceRequired} Yrs - {item.requirements}</p>
                          </div>
                        )}
                        {activeTab === 'candidates' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.firstName} {item.lastName}</p>
                            <p className="text-slate-500">{item.email} - Match Score: {item.rankingScore || 'N/A'}/100</p>
                          </div>
                        )}
                        {activeTab === 'tickets' && (
                          <div>
                            <p className="font-bold text-slate-900">{item.category}</p>
                            <p className="text-slate-500">{item.description}</p>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {item.id.substring(0, 8)}...
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase border
                          ${(!item.status)
                            ? 'bg-slate-50 text-slate-400 border-slate-200'
                            : (item.status === 'APPROVED' || item.status === 'PAID' || item.status === 'ACTIVE' || item.status === 'PRESENT' || item.status === 'OPEN') 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : (item.status.includes('PENDING') || item.status === 'APPLIED' || item.status === 'SHORTLISTED' || item.status === 'SCHEDULED' || item.status === 'DRAFT') 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100' 
                            : 'bg-red-50 text-red-700 border-red-100'}
                        `}>
                          {item.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 space-x-1">
                        {activeTab === 'leaves' && user?.role === 'HR_MANAGER' && item.status === 'PENDING_HR' && (
                          <>
                            <button onClick={() => handleDecision('leave', item.id, 'APPROVED')} className="px-2 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Approve</button>
                            <button onClick={() => handleDecision('leave', item.id, 'REJECTED')} className="px-2 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700">Reject</button>
                          </>
                        )}
                        {activeTab === 'tickets' && (user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER') && item.status === 'PENDING_ADMIN' && (
                          <button onClick={() => handleDecision('ticket', item.id, 'RESOLVED', 'Completed')} className="px-2 py-1 bg-green-600 text-white rounded font-bold hover:bg-green-700">Resolve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. FORMS MODAL DRAWER */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 font-bold text-slate-500 hover:text-slate-800"
            >
              Close (x)
            </button>
            <h3 className="font-bold text-lg text-slate-950 mb-4 capitalize">New {formType} Form</h3>
            
            {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-semibold mb-3">{formError}</div>}
            {formSuccess && <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-semibold mb-3">{formSuccess}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {formType === 'leave' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Leave Type</label>
                    <select 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select leave type</option>
                      <option value="CASUAL_LEAVE">Casual Leave</option>
                      <option value="SICK_LEAVE">Sick Leave</option>
                      <option value="EARNED_LEAVE">Earned Leave</option>
                      <option value="DUTY_LEAVE">Duty Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Start Date</label>
                    <input 
                      type="date" 
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">End Date</label>
                    <input 
                      type="date" 
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Reason</label>
                    <textarea 
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                </>
              )}

              {formType === 'publication' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Type</label>
                    <select 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    >
                      <option value="JOURNAL">Journal</option>
                      <option value="CONFERENCE">Conference</option>
                      <option value="BOOK">Book</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Title</label>
                    <input 
                      type="text" 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Journal/Book Name</label>
                    <input 
                      type="text" 
                      onChange={(e) => setFormData({ ...formData, journalBookName: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Year</label>
                    <input 
                      type="number" 
                      defaultValue={new Date().getFullYear()}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                </>
              )}

              {formType === 'payroll' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Month (Number)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Year</label>
                    <input 
                      type="number" 
                      defaultValue={new Date().getFullYear()}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                </>
              )}

              {formType === 'ticket' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Category</label>
                    <select 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    >
                      <option value="IT_SUPPORT">IT Support</option>
                      <option value="ID_CARD">ID Card Request</option>
                      <option value="EQUIPMENT">Equipment Allocation</option>
                      <option value="INFRASTRUCTURE_SUPPORT">Infrastructure Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 uppercase">Description</label>
                    <textarea 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="w-full border p-2 rounded bg-slate-50"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold"
              >
                Submit Form
              </button>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// Simple loader helper
function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
