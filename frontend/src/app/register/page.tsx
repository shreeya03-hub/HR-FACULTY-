'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load departments list for dropdown selection
    const fetchDepts = async () => {
      try {
        // We call our API list. Since we might not be authenticated, we'll try a public fetch or fallback
        const res = await fetch('http://localhost:5000/api/faculty/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setDepartmentId(data.departments[0].id);
          }
        } else {
          // fallback mock departments if DB isn't seeded yet or not responding
          const mockDepts = [
            { id: 'cse-dept-mock-1', name: 'Computer Science & Engineering', code: 'CSE' },
            { id: 'ece-dept-mock-2', name: 'Electronics & Communication', code: 'ECE' },
            { id: 'me-dept-mock-3', name: 'Mechanical Engineering', code: 'ME' },
            { id: 'hs-dept-mock-4', name: 'Humanities & Sciences', code: 'H&S' }
          ];
          setDepartments(mockDepts);
          setDepartmentId(mockDepts[0].id);
        }
      } catch (err) {
        const mockDepts = [
          { id: 'cse-dept-mock-1', name: 'Computer Science & Engineering', code: 'CSE' },
          { id: 'ece-dept-mock-2', name: 'Electronics & Communication', code: 'ECE' },
          { id: 'me-dept-mock-3', name: 'Mechanical Engineering', code: 'ME' },
          { id: 'hs-dept-mock-4', name: 'Humanities & Sciences', code: 'H&S' }
        ];
        setDepartments(mockDepts);
        setDepartmentId(mockDepts[0].id);
      }
    };
    fetchDepts();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'DEAN',
          firstName,
          lastName,
          phone,
          departmentId,
          designation,
          gender,
          dateOfBirth,
          dateOfJoining
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Faculty profile registered successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button 
            onClick={() => router.push('/login')} 
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-slate-900 text-lg">Faculty Registration</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm font-medium animate-pulse">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-l-4 border-blue-600 pl-3">Account Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@university.edu"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 border-l-4 border-blue-600 pl-3 pt-2">Personal Profiles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 border-l-4 border-blue-600 pl-3 pt-2">Academic & Assignment Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Adjunct Professor">Adjunct Professor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date of Joining</label>
              <input
                type="date"
                required
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mt-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
