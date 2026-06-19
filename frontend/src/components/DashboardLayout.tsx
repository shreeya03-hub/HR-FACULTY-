'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  FileText,
  Briefcase,
  Users,
  Award,
  CreditCard,
  Wrench,
  TrendingUp,
  BrainCircuit,
  LogOut,
  Menu,
  X,
  Building,
  GraduationCap
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return null;
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Define navigation links based on user roles
  const getNavLinks = () => {
    const base = [
      { id: 'overview', name: 'Overview', icon: LayoutDashboard }
    ];

    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          ...base,
          { id: 'departments', name: 'Departments', icon: Building },
          { id: 'faculties', name: 'Faculty Registry', icon: Users },
          { id: 'tickets', name: 'Helpdesk Tickets', icon: Wrench },
          { id: 'logs', name: 'Security Audit Logs', icon: FileText }
        ];

      case 'HR_MANAGER':
        return [
          ...base,
          { id: 'faculties', name: 'Employee Directory', icon: Users },
          { id: 'recruitment', name: 'Recruitment board', icon: Briefcase },
          { id: 'leaves', name: 'Leave Approvals', icon: CalendarCheck },
          { id: 'payroll', name: 'Payroll Processing', icon: CreditCard },
          { id: 'appraisal', name: 'Appraisal Cycle', icon: Award },
          { id: 'exits', name: 'Exits & Clearances', icon: LogOut },
          { id: 'ai-hub', name: 'HR AI Features', icon: BrainCircuit },
          { id: 'profile', name: 'My Profile', icon: User },
          { id: 'attendance', name: 'My Attendance Logs', icon: FileText },
          { id: 'slips', name: 'My Salary Slips', icon: CreditCard },
          { id: 'tickets', name: 'My Service Requests', icon: Wrench }
        ];

      case 'DEAN':
        return [
          ...base,
          { id: 'faculties', name: 'Faculty Records', icon: Users },
          { id: 'workload', name: 'Workload & Timetable', icon: TrendingUp },
          { id: 'appraisals', name: 'Appraisal Reviews', icon: Award },
          { id: 'naac-metrics', name: 'Accreditation Center', icon: GraduationCap },
          { id: 'ai-hub', name: 'AI Decision Insights', icon: BrainCircuit },
          { id: 'profile', name: 'My Profile', icon: User },
          { id: 'leaves', name: 'Apply Leave', icon: CalendarCheck },
          { id: 'attendance', name: 'Attendance Logs', icon: FileText },
          { id: 'publications', name: 'Research Papers', icon: Award },
          { id: 'fdp', name: 'FDP Tracker', icon: GraduationCap },
          { id: 'slips', name: 'Salary Slips', icon: CreditCard },
          { id: 'tickets', name: 'Service Requests', icon: Wrench },
          { id: 'naac', name: 'NAAC Contributions', icon: FileText },
          { id: 'appraisal', name: 'Self Appraisal', icon: Award }
        ];

      default:
        return base;
    }
  };

  const links = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 px-6 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-500" />
            <span className="font-bold text-lg tracking-wider">HERP SYSTEM</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150
                  ${active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar User Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 uppercase">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </header>

        {/* Dynamic Panel Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
