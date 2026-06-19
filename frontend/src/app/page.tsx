'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Users, 
  CalendarCheck, 
  Award, 
  CreditCard, 
  Wrench, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navigation Header */}
      <header className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="font-bold text-xl tracking-wide text-slate-900">University HERP</span>
        </div>
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center gap-1 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Sign In
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-6 py-20 bg-gradient-to-b from-blue-50/30 to-transparent">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full mb-6">
          Enterprise ERP for Colleges & Universities
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-950 max-w-4xl tracking-tight leading-tight">
          Unified Faculty Lifecycle & <br />
          <span className="text-blue-600">HR Operations Platform</span>
        </h1>
        <p className="mt-6 text-lg text-slate-500 max-w-2xl leading-relaxed">
          Manage recruitment, payroll, attendances, leave requests, appraisals, NAAC reporting, publications, and service tickets in a secure, role-restricted dashboard.
        </p>
        <div className="mt-10 flex gap-4">
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/10"
          >
            Access Portal Dashboard
          </button>
          <button 
            onClick={() => router.push('/register')}
            className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-50 transition-all"
          >
            Faculty Register
          </button>
        </div>
      </section>

      {/* Grid Features */}
      <section className="max-w-7xl w-full mx-auto px-6 py-20 border-t border-slate-100">
        <h2 className="text-3xl font-extrabold text-slate-950 text-center tracking-tight">Modules & Capabilities</h2>
        <p className="mt-2 text-slate-500 text-center text-sm mb-16">All systems built natively to meet NAAC and NBA accreditation standards.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">Faculty Lifecycle</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Complete faculty records from recruitment applications, shortlists, onboarding, qualification audits, publications tracker, to exit clearances.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">Payroll & Deductions</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Automated salary computation with allowances, HRA, PF contributions, TDS brackets, clearance checklists, and PDF slip generation.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">Attendance & Leave</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Biometric device simulator hooks, real-time clock-in audits, late triggers, leave balance counts, and multi-tier approval flows.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">Publications & FDPs</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Track research papers, books, DOI records, patent filings, and professional development programs (FDPs) organized by departments.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">AI Decision Hub</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Resume screenings, automated appraisal write-ups, workload balancing advice, attrition prediction scores, and payroll anomaly checks.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:border-blue-200 transition-colors">
            <div className="h-12 w-12 bg-blue-100/50 text-blue-600 flex items-center justify-center rounded-xl mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-950 mb-2">Accreditation (NAAC)</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Compile criterion-wise statistics, calculate Ph.D. holder ratios, compute mean years of experience, and export reports for auditors.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-8 px-6 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} University Faculty & HR Management System. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
