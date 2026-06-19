import { PrismaClient } from '@prisma/client';
import { Role, FacultyStatus, AttendanceStatus, LeaveType, LeaveRequestStatus, PublicationType, PatentStatus, FdpType, PayrollStatus, JobStatus, CandidateStatus, ServiceRequestCategory, ServiceRequestStatus, AppraisalStatus } from '../src/utils/enums';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Beginning database seeding with extensive dummy data...');

  // Clean old records in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.naacContribution.deleteMany({});
  await prisma.appraisal.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.recruitmentJob.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.fdpRecord.deleteMany({});
  await prisma.patent.deleteMany({});
  await prisma.publication.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.qualification.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Core Departments
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' }
  });
  const eceDept = await prisma.department.create({
    data: { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication Engineering' }
  });
  const meDept = await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' }
  });
  const hsDept = await prisma.department.create({
    data: { name: 'Humanities & Sciences', code: 'H&S', description: 'Basic Science, Physics, Chemistry & Humanities' }
  });
  const civilDept = await prisma.department.create({
    data: { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' }
  });

  const depts = [cseDept, eceDept, meDept, hsDept, civilDept];
  console.log('[Seed] Created 5 departments.');

  // 2. Create Core Users (Admin, HR, Dean)
  const coreUsers = [
    { email: 'admin@university.edu', role: Role.SUPER_ADMIN, firstName: 'Super', lastName: 'Admin', phone: '9876543210' },
    { email: 'hr@university.edu', role: Role.HR_MANAGER, firstName: 'Sarah', lastName: 'HR', phone: '9876543211' },
    { email: 'dean@university.edu', role: Role.DEAN, firstName: 'Dr. Clara', lastName: 'Oswald', phone: '9876543212' }
  ];

  const userMap: { [key: string]: any } = {};

  for (const item of coreUsers) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash,
        role: item.role,
        firstName: item.firstName,
        lastName: item.lastName,
        phone: item.phone
      }
    });
    userMap[item.email] = user;
  }

  // 3. Create Additional Faculty Users (Dean role representing Academic/Faculty staff)
  const facultyUsersData = [
    { email: 'alan.turing@university.edu', firstName: 'Alan', lastName: 'Turing', phone: '9876540001', dept: cseDept, designation: 'Professor', gender: 'Male', basicPay: 115000.0, age: 45 },
    { email: 'grace.hopper@university.edu', firstName: 'Grace', lastName: 'Hopper', phone: '9876540002', dept: cseDept, designation: 'Associate Professor', gender: 'Female', basicPay: 95000.0, age: 39 },
    { email: 'ada.lovelace@university.edu', firstName: 'Ada', lastName: 'Lovelace', phone: '9876540003', dept: cseDept, designation: 'Assistant Professor', gender: 'Female', basicPay: 75000.0, age: 29 },
    { email: 'richard.feynman@university.edu', firstName: 'Richard', lastName: 'Feynman', phone: '9876540004', dept: hsDept, designation: 'Professor', gender: 'Male', basicPay: 110000.0, age: 43 },
    { email: 'marie.curie@university.edu', firstName: 'Marie', lastName: 'Curie', phone: '9876540005', dept: hsDept, designation: 'Professor', gender: 'Female', basicPay: 120000.0, age: 46 },
    { email: 'albert.einstein@university.edu', firstName: 'Albert', lastName: 'Einstein', phone: '9876540006', dept: eceDept, designation: 'Professor', gender: 'Male', basicPay: 130000.0, age: 50 },
    { email: 'nikola.tesla@university.edu', firstName: 'Nikola', lastName: 'Tesla', phone: '9876540007', dept: eceDept, designation: 'Associate Professor', gender: 'Male', basicPay: 92000.0, age: 37 },
    { email: 'wernher.vonbraun@university.edu', firstName: 'Wernher', lastName: 'Von Braun', phone: '9876540008', dept: meDept, designation: 'Professor', gender: 'Male', basicPay: 105000.0, age: 44 },
    { email: 'leonardo.davinci@university.edu', firstName: 'Leonardo', lastName: 'Da Vinci', phone: '9876540009', dept: civilDept, designation: 'Professor', gender: 'Male', basicPay: 125000.0, age: 52 }
  ];

  for (const facData of facultyUsersData) {
    const user = await prisma.user.create({
      data: {
        email: facData.email,
        passwordHash,
        role: Role.DEAN, // All academic/faculty are assigned DEAN role as simplified
        firstName: facData.firstName,
        lastName: facData.lastName,
        phone: facData.phone
      }
    });
    userMap[facData.email] = user;
  }

  console.log('[Seed] Created users.');

  // 4. Create Faculty Profiles
  // Sarah HR Profile (H&S Dept)
  const hrFaculty = await prisma.faculty.create({
    data: {
      userId: userMap['hr@university.edu'].id,
      departmentId: hsDept.id,
      designation: 'HR Manager',
      dateOfJoining: new Date(2018, 5, 1),
      dateOfBirth: new Date(1985, 8, 22),
      gender: 'Female',
      basicPay: 85000.0,
      status: FacultyStatus.ACTIVE,
      panNumber: 'HRMGR7766A',
      pfNumber: 'PF-HR-998877',
      bankAccountNumber: '998800112233',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0000888'
    }
  });

  // Dean Dr. Clara Oswald Profile (ECE Dept)
  const deanFaculty = await prisma.faculty.create({
    data: {
      userId: userMap['dean@university.edu'].id,
      departmentId: eceDept.id,
      designation: 'Dean & Professor',
      dateOfJoining: new Date(2012, 4, 1),
      dateOfBirth: new Date(1978, 2, 21),
      gender: 'Female',
      basicPay: 140000.0,
      status: FacultyStatus.ACTIVE,
      panNumber: 'DEANECE5678K',
      pfNumber: 'PF-ECE-098765',
      bankAccountNumber: '444455556666',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0004321'
    }
  });

  const facultyProfiles: any[] = [deanFaculty];

  // Additional Faculty Profiles
  for (const facData of facultyUsersData) {
    const profile = await prisma.faculty.create({
      data: {
        userId: userMap[facData.email].id,
        departmentId: facData.dept.id,
        designation: facData.designation,
        dateOfJoining: new Date(2015 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 11), 1),
        dateOfBirth: new Date(1990 - facData.age, Math.floor(Math.random() * 11), 15),
        gender: facData.gender,
        basicPay: facData.basicPay,
        status: FacultyStatus.ACTIVE,
        panNumber: 'PAN' + facData.firstName.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000) + 'X',
        pfNumber: 'PF-REG-' + Math.floor(100000 + Math.random() * 900000),
        bankAccountNumber: 'ACT' + Math.floor(100000000 + Math.random() * 900000000),
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0000555'
      }
    });
    facultyProfiles.push(profile);
  }

  const allFaculties = [hrFaculty, ...facultyProfiles];
  console.log(`[Seed] Created ${allFaculties.length} faculty profiles.`);

  // 5. Qualifications & Experiences
  for (const fac of facultyProfiles) {
    // Qualifications
    await prisma.qualification.createMany({
      data: [
        { facultyId: fac.id, degree: 'Ph.D.', specialization: 'Advanced Engineering', institution: 'MIT / IIT', university: 'MIT / IIT', yearOfPassing: 2010 + Math.floor(Math.random() * 6), percentage: 85 + Math.random() * 12 },
        { facultyId: fac.id, degree: 'M.Tech', specialization: 'Core Technology Systems', institution: 'State University', university: 'State University', yearOfPassing: 2005 + Math.floor(Math.random() * 5), percentage: 78 + Math.random() * 15 }
      ]
    });

    // Experiences
    await prisma.experience.createMany({
      data: [
        { facultyId: fac.id, companyName: 'Global Tech Corp', designation: 'Senior Analyst / Engineer', fromDate: new Date(2005, 5, 1), toDate: new Date(2009, 8, 30), totalYears: 4.3 },
        { facultyId: fac.id, companyName: 'Technical Institute', designation: 'Assistant Professor', fromDate: new Date(2010, 0, 15), toDate: new Date(2014, 5, 1), totalYears: 4.4 }
      ]
    });
  }
  console.log('[Seed] Created qualifications and experience records.');

  // 6. Leave Balances for all active faculties for 2026
  for (const fac of allFaculties) {
    await prisma.leaveBalance.create({
      data: {
        facultyId: fac.id,
        year: 2026,
        casualLeave: 12,
        sickLeave: 10,
        earnedLeave: 15,
        dutyLeave: 8,
        maternityLeave: fac.gender === 'Female' ? 180 : 0
      }
    });
  }

  // 7. Leave Requests (Various statuses: PENDING_HR, APPROVED, REJECTED)
  const leaveReasons = [
    'Attending International Tech Summit',
    'Personal medical checkup',
    'Family function and travel',
    'Research conference collaboration',
    'Slight fever/illness',
    'Urgent domestic work'
  ];

  const leaveRequestsData = [
    { faculty: deanFaculty, type: LeaveType.CASUAL_LEAVE, days: 2, status: LeaveRequestStatus.PENDING_HR, offset: 2 },
    { faculty: facultyProfiles[0], type: LeaveType.SICK_LEAVE, days: 3, status: LeaveRequestStatus.APPROVED, offset: -10 },
    { faculty: facultyProfiles[1], type: LeaveType.DUTY_LEAVE, days: 5, status: LeaveRequestStatus.APPROVED, offset: -2 },
    { faculty: facultyProfiles[2], type: LeaveType.CASUAL_LEAVE, days: 1, status: LeaveRequestStatus.REJECTED, offset: 5 },
    { faculty: facultyProfiles[3], type: LeaveType.EARNED_LEAVE, days: 4, status: LeaveRequestStatus.PENDING_HR, offset: 8 },
    { faculty: facultyProfiles[4], type: LeaveType.SICK_LEAVE, days: 2, status: LeaveRequestStatus.PENDING_HR, offset: 1 },
    { faculty: facultyProfiles[5], type: LeaveType.DUTY_LEAVE, days: 3, status: LeaveRequestStatus.APPROVED, offset: -15 }
  ];

  for (let idx = 0; idx < leaveRequestsData.length; idx++) {
    const data = leaveRequestsData[idx];
    const start = new Date(2026, 5, 20 + data.offset);
    const end = new Date(start);
    end.setDate(start.getDate() + data.days - 1);

    await prisma.leaveRequest.create({
      data: {
        facultyId: data.faculty.id,
        type: data.type,
        startDate: start,
        endDate: end,
        totalDays: data.days,
        reason: leaveReasons[idx % leaveReasons.length],
        status: data.status,
        remarks: data.status === LeaveRequestStatus.REJECTED ? 'Insufficient staffing for details' : (data.status === LeaveRequestStatus.APPROVED ? 'Approved by HR Manager' : null)
      }
    });
  }
  console.log('[Seed] Created leave requests.');

  // 8. Research Publications
  const publicationTitles = [
    { title: 'Applying Deep Learning Models in VLSI Design Frameworks', type: PublicationType.JOURNAL, criteria: '3.4.4' },
    { title: 'Performance Audits of Heat Dissipation in Multi-Core Circuits', type: PublicationType.JOURNAL, criteria: '3.4.4' },
    { title: 'Decentralized Smart Workload Scheduling in Edge Clusters', type: PublicationType.CONFERENCE, criteria: '3.4.5' },
    { title: 'Innovative Pedagogy for Virtual Systems Labs', type: PublicationType.BOOK, criteria: '3.4.6' },
    { title: 'Carbon Nanotubes and Thermal Engineering Benchmarks', type: PublicationType.JOURNAL, criteria: '3.4.4' },
    { title: 'Design Principles for Structural Bridges using CAD Systems', type: PublicationType.JOURNAL, criteria: '3.4.4' }
  ];

  for (let idx = 0; idx < publicationTitles.length; idx++) {
    const pub = publicationTitles[idx];
    // Assign to different faculty profiles
    const fac = facultyProfiles[idx % facultyProfiles.length];

    await prisma.publication.create({
      data: {
        facultyId: fac.id,
        type: pub.type,
        title: pub.title,
        journalBookName: idx % 2 === 0 ? 'IEEE Transactions on Engineering' : 'Springer Lecture Notes',
        volume: '12',
        issue: '4',
        pages: '101-118',
        year: 2025 - Math.floor(Math.random() * 3),
        doi: `10.1009/sub.${idx}2993`,
        status: idx % 4 === 0 ? 'PENDING' : 'APPROVED',
        criteriaNaac: pub.criteria
      }
    });
  }

  // 9. Patents
  const patentTitles = [
    'Smart Attendance Verification Biometric Sensor Module',
    'Low-Complexity High-Throughput DSP Engine',
    'Self-Healing Mechanical Joint for Load Balancing'
  ];

  for (let idx = 0; idx < patentTitles.length; idx++) {
    const fac = facultyProfiles[idx % facultyProfiles.length];
    await prisma.patent.create({
      data: {
        facultyId: fac.id,
        title: patentTitles[idx],
        applicationNumber: `PAT-2026-000${idx}88`,
        status: idx % 3 === 0 ? PatentStatus.GRANTED : PatentStatus.FILED,
        filingDate: new Date(2024, idx, 10),
        grantDate: idx % 3 === 0 ? new Date(2025, 10, 15) : null
      }
    });
  }

  // 10. FDP Workshops
  const fdpNames = [
    'Workshop on Advanced Generative AI & Prompt Engineering',
    'Instructional Design Methodologies for Engineering Classrooms',
    'Embedded Computing Systems Hands-On boot camp',
    'Sustainable Infrastructure Design Systems and NAAC Audits'
  ];

  for (let idx = 0; idx < fdpNames.length; idx++) {
    const fac = facultyProfiles[idx % facultyProfiles.length];
    await prisma.fdpRecord.create({
      data: {
        facultyId: fac.id,
        type: FdpType.FDP,
        title: fdpNames[idx],
        organization: idx % 2 === 0 ? 'IIT Delhi' : 'AICTE Training Center',
        fromDate: new Date(2025, idx, 5),
        toDate: new Date(2025, idx, 10),
        durationDays: 5
      }
    });
  }
  console.log('[Seed] Created academic records (publications, patents, FDPs).');

  // 11. Attendance Logs (Simulate for last 15 days)
  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    logDate.setHours(0,0,0,0);
    
    // Skip Sunday
    if (logDate.getDay() === 0) continue;

    for (const fac of allFaculties) {
      // HR/Dean have slightly different log times
      const punchIn = new Date(logDate);
      const isLate = Math.random() < 0.15;
      
      punchIn.setHours(isLate ? 9 : 8, isLate ? Math.floor(10 + Math.random() * 20) : Math.floor(30 + Math.random() * 25), 0, 0);

      const punchOut = new Date(logDate);
      punchOut.setHours(17, Math.floor(Math.random() * 15), 0, 0);

      const diff = punchOut.getTime() - punchIn.getTime();
      const totalHours = Math.round((diff / (1000 * 3600)) * 10) / 10;

      await prisma.attendance.create({
        data: {
          facultyId: fac.id,
          date: logDate,
          status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
          punchIn,
          punchOut,
          totalHours,
          source: 'BIOMETRIC'
        }
      }).catch(() => {
        // Suppress duplicate seed warnings if run consecutively
      });
    }
  }
  console.log('[Seed] Generated biometric attendance logs.');

  // 12. Recruitment Jobs
  const recruitmentJobsData = [
    { title: 'Assistant Professor in CSE (AI & Data Science)', dept: cseDept, exp: 2.0, status: JobStatus.OPEN, desc: 'Position for teaching Python, AI systems, and machine learning.' },
    { title: 'Associate Professor in VLSI Design & Microelectronics', dept: eceDept, exp: 5.0, status: JobStatus.OPEN, desc: 'Position for leading chip design, VLSI layouts labs and publishing.' },
    { title: 'Assistant Professor in CAD & Robotics systems', dept: meDept, exp: 3.0, status: JobStatus.CLOSED, desc: 'Teaching 3D printing and CAD systems algorithms.' },
    { title: 'Assistant Professor in Applied Mathematics', dept: hsDept, exp: 1.0, status: JobStatus.OPEN, desc: 'Teaching basic linear algebra, statistics and numerical methods.' }
  ];

  const jobs: any[] = [];
  for (const jobData of recruitmentJobsData) {
    const job = await prisma.recruitmentJob.create({
      data: {
        title: jobData.title,
        departmentId: jobData.dept.id,
        description: jobData.desc,
        requirements: 'Ph.D. or Master\'s degree with excellent academic index.',
        experienceRequired: jobData.exp,
        status: jobData.status
      }
    });
    jobs.push(job);
  }

  // 13. Candidate Applications & Scheduled Interviews
  const candidatesData = [
    { first: 'Nikola', last: 'Tesla', email: 'nikola.tesla@gmail.com', score: 94.0, status: CandidateStatus.OFFERED, jobIdx: 1 },
    { first: 'Marie', last: 'Curie', email: 'marie.curie.sci@gmail.com', score: 92.5, status: CandidateStatus.APPLIED, jobIdx: 3 },
    { first: 'Isaac', last: 'Newton', email: 'isaac.gravity@gmail.com', score: 86.0, status: CandidateStatus.INTERVIEWED, jobIdx: 0 },
    { first: 'Albert', last: 'Einstein', email: 'albert.relativity@gmail.com', score: 89.0, status: CandidateStatus.SHORTLISTED, jobIdx: 1 },
    { first: 'Charles', last: 'Darwin', email: 'charles.evolution@gmail.com', score: 72.0, status: CandidateStatus.REJECTED, jobIdx: 0 }
  ];

  for (let idx = 0; idx < candidatesData.length; idx++) {
    const cData = candidatesData[idx];
    const job = jobs[cData.jobIdx % jobs.length];

    const candidate = await prisma.candidate.create({
      data: {
        jobId: job.id,
        firstName: cData.first,
        lastName: cData.last,
        email: cData.email,
        phone: '955566000' + idx,
        status: cData.status,
        rankingScore: cData.score,
        aiFeedback: `Candidate resume matches core skills. Verified background in specialized engineering. Experience coefficient is ${job.experienceRequired} years.`
      }
    });

    // Schedule interview for Shortlisted or Interviewed candidates
    if (cData.status === CandidateStatus.SHORTLISTED || cData.status === CandidateStatus.INTERVIEWED) {
      await prisma.interview.create({
        data: {
          candidateId: candidate.id,
          interviewDate: new Date(2026, 5, 25),
          interviewerIds: JSON.stringify([deanFaculty.userId]),
          mode: 'ONLINE',
          status: 'SCHEDULED'
        }
      });
    }
  }
  console.log('[Seed] Created recruitment jobs and candidate tracking logs.');

  // 14. Service Requests (Helpdesk Tickets)
  const ticketDescriptions = [
    { desc: 'Office printer is failing to sync with corporate wifi network.', cat: ServiceRequestCategory.IT_SUPPORT, prio: 'MEDIUM', status: ServiceRequestStatus.PENDING_ADMIN },
    { desc: 'New faculty ID card request following renewal.', cat: ServiceRequestCategory.ID_CARD, prio: 'LOW', status: ServiceRequestStatus.RESOLVED },
    { desc: 'Projector display resolution is distorted in Lecture Hall 3.', cat: ServiceRequestCategory.EQUIPMENT, prio: 'HIGH', status: ServiceRequestStatus.PENDING_ADMIN },
    { desc: 'AC leaks and causes damp walls in department room E201.', cat: ServiceRequestCategory.INFRASTRUCTURE_SUPPORT, prio: 'MEDIUM', status: ServiceRequestStatus.PENDING_ADMIN },
    { desc: 'Requesting whiteboard marker packs and dusters.', cat: ServiceRequestCategory.EQUIPMENT, prio: 'LOW', status: ServiceRequestStatus.RESOLVED }
  ];

  for (let idx = 0; idx < ticketDescriptions.length; idx++) {
    const t = ticketDescriptions[idx];
    // Alternate creators
    const creator = facultyProfiles[idx % facultyProfiles.length];

    await prisma.serviceRequest.create({
      data: {
        facultyId: creator.id,
        category: t.cat,
        description: t.desc,
        priority: t.prio,
        status: t.status,
        comments: t.status === ServiceRequestStatus.RESOLVED ? 'Issued and resolved by helpdesk supervisor.' : null
      }
    });
  }
  console.log('[Seed] Generated IT and facilities service tickets.');

  // 15. Faculty Appraisals
  for (let idx = 0; idx < facultyProfiles.length; idx++) {
    const fac = facultyProfiles[idx];
    
    // Some are approved, some are pending review, some are draft
    let status: AppraisalStatus;
    if (idx % 4 === 0) status = AppraisalStatus.DRAFT;
    else if (idx % 4 === 1) status = AppraisalStatus.APPROVED;
    else if (idx % 4 === 2) status = AppraisalStatus.DEAN_REVIEW;
    else status = AppraisalStatus.HR_REVIEW;

    await prisma.appraisal.create({
      data: {
        facultyId: fac.id,
        academicYear: '2025-2026',
        teachingScore: 7.0 + Math.random() * 3,
        researchScore: 6.5 + Math.random() * 3.5,
        publicationsScore: 6.0 + Math.random() * 4,
        feedbackScore: 8.0 + Math.random() * 2,
        fdpScore: 7.5 + Math.random() * 2.5,
        selfRating: 7.5 + Math.random() * 2,
        selfComments: 'Maintained teaching workload, published scientific articles, and contributed to NAAC criteria preparation.',
        deanRating: status !== AppraisalStatus.DEAN_REVIEW && status !== AppraisalStatus.DRAFT ? 8.2 : null,
        deanComments: status !== AppraisalStatus.DEAN_REVIEW && status !== AppraisalStatus.DRAFT ? 'Exemplary teaching dedication.' : null,
        hrRating: status === AppraisalStatus.APPROVED ? 8.5 : null,
        hrComments: status === AppraisalStatus.APPROVED ? 'Approved annual increments and promotion benefits.' : null,
        status: status
      }
    });
  }
  console.log('[Seed] Created faculty performance appraisals.');

  // 16. NAAC Contributions
  const naacContribs = [
    { type: 'RESEARCH_GRANT', title: 'Cyber-Physical Systems low-power validation project', desc: 'DST Funded Research Project, grant reference #2291', val: 240000.0 },
    { type: 'CONSULTANCY', title: 'Local Smart-City Grid design advice consulting', desc: 'Consulting services for municipal power grid layouts', val: 75000.0 },
    { type: 'PUBLICATION', title: 'Optimized Energy Balancing Algorithms', desc: 'Journal Paper Publication indexing high impact factors', val: null },
    { type: 'STUDENT_MENTORING', title: 'Mentoring 6 PhD candidates and 12 B.Tech projects', desc: 'Mentoring portfolios across semester batches', val: null }
  ];

  for (let idx = 0; idx < naacContribs.length; idx++) {
    const c = naacContribs[idx];
    const fac = facultyProfiles[idx % facultyProfiles.length];

    await prisma.naacContribution.create({
      data: {
        facultyId: fac.id,
        type: c.type,
        title: c.title,
        description: c.desc,
        year: 2025,
        valueAmount: c.val,
        status: idx % 3 === 0 ? 'PENDING' : 'APPROVED'
      }
    });
  }
  console.log('[Seed] Generated NAAC SSR Accreditation contribution records.');

  // 17. Payroll Processing History (Simulate for last 4 months: Feb, March, April, May of 2026)
  const months = [2, 3, 4, 5]; // Feb, Mar, Apr, May
  const year = 2026;

  for (const month of months) {
    for (const fac of allFaculties) {
      // Basic Pay
      const basic = fac.basicPay;
      const hra = basic * 0.15; // 15% HRA
      const da = basic * 0.10;  // 10% DA
      const allowances = month % 2 === 0 ? 5000.0 : 2500.0;
      const gross = basic + hra + da + allowances;

      const pf = basic * 0.12;  // 12% PF deduction
      const tax = gross > 100000 ? gross * 0.15 : gross * 0.10; // Tax
      const deductions = pf + tax;
      const net = gross - deductions;

      await prisma.payroll.create({
        data: {
          facultyId: fac.id,
          month,
          year,
          basicPay: basic,
          hra,
          da,
          allowances,
          grossSalary: gross,
          pfDeduction: pf,
          taxDeduction: tax,
          otherDeductions: 0.0,
          totalDeductions: deductions,
          netSalary: net,
          status: PayrollStatus.PAID,
          paidAt: new Date(year, month - 1, 30),
          processedAt: new Date(year, month - 1, 28)
        }
      }).catch(() => {
        // Suppress duplicates
      });
    }
  }
  console.log('[Seed] Generated multi-month payroll history logs.');

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
