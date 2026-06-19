import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { ServiceRequestCategory, ServiceRequestStatus, FacultyStatus } from '../utils/enums';

export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.facultyId) {
    return res.status(400).json({ error: 'This user does not have an associated faculty profile.' });
  }

  try {
    const profile = await prisma.faculty.findUnique({
      where: { id: req.user.facultyId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true
          }
        },
        department: true,
        qualifications: true,
        experiences: true
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error fetching faculty profile.' });
  }
};

export const getFacultyProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const profile = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true
          }
        },
        department: true,
        qualifications: true,
        experiences: true
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching profile.' });
  }
};

export const updateFacultyProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const targetFacultyId = req.user.facultyId || req.body.facultyId;
  if (!targetFacultyId) {
    return res.status(400).json({ error: 'Faculty ID required' });
  }

  const {
    firstName,
    lastName,
    phone,
    designation,
    dateOfBirth,
    gender,
    panNumber,
    pfNumber,
    bankAccountNumber,
    bankName,
    ifscCode,
    basicPay,
    status,
    profilePhotoUrl,
    resumeUrl
  } = req.body;

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id: targetFacultyId },
      include: { user: true }
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found' });
    }

    // Authorization: User can update their own profile, or HR_MANAGER/SUPER_ADMIN can update anyone's
    const isOwner = req.user.facultyId === targetFacultyId;
    const isHR = req.user.role === 'HR_MANAGER' || req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isHR) {
      return res.status(403).json({ error: 'You do not have permission to update this profile' });
    }

    // Only HR/Admin can update basicPay and status
    const updateBasicPay = isHR ? basicPay : faculty.basicPay;
    const updateStatus = isHR ? status : faculty.status;

    const updated = await prisma.$transaction(async (tx: any) => {
      // Update User fields
      await tx.user.update({
        where: { id: faculty.userId },
        data: {
          firstName: firstName || faculty.user.firstName,
          lastName: lastName || faculty.user.lastName,
          phone: phone !== undefined ? phone : faculty.user.phone
        }
      });

      // Update Faculty fields
      const updatedFaculty = await tx.faculty.update({
        where: { id: targetFacultyId },
        data: {
          designation: designation || faculty.designation,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : faculty.dateOfBirth,
          gender: gender || faculty.gender,
          panNumber: panNumber !== undefined ? panNumber : faculty.panNumber,
          pfNumber: pfNumber !== undefined ? pfNumber : faculty.pfNumber,
          bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : faculty.bankAccountNumber,
          bankName: bankName !== undefined ? bankName : faculty.bankName,
          ifscCode: ifscCode !== undefined ? ifscCode : faculty.ifscCode,
          basicPay: updateBasicPay,
          status: updateStatus as FacultyStatus,
          profilePhotoUrl: profilePhotoUrl !== undefined ? profilePhotoUrl : faculty.profilePhotoUrl,
          resumeUrl: resumeUrl !== undefined ? resumeUrl : faculty.resumeUrl
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          department: true
        }
      });

      return updatedFaculty;
    });

    await logAudit(req.user.id, 'FACULTY_PROFILE_UPDATE', `Updated profile of faculty ID ${targetFacultyId}`);

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updated
    });
  } catch (error: any) {
    console.error('[Profile Update Error]', error);
    return res.status(500).json({ error: 'Error updating profile' });
  }
};

export const listFaculties = async (req: AuthenticatedRequest, res: Response) => {
  const { departmentId, status, search } = req.query;

  try {
    const filters: any = {};

    if (departmentId) {
      filters.departmentId = departmentId as string;
    }

    if (status) {
      filters.status = status as FacultyStatus;
    }

    if (search) {
      filters.OR = [
        {
          user: {
            firstName: { contains: search as string, mode: 'insensitive' }
          }
        },
        {
          user: {
            lastName: { contains: search as string, mode: 'insensitive' }
          }
        },
        {
          user: {
            email: { contains: search as string, mode: 'insensitive' }
          }
        },
        {
          designation: { contains: search as string, mode: 'insensitive' }
        }
      ];
    }

    const list = await prisma.faculty.findMany({
      where: filters,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        department: true
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    return res.status(200).json({ faculties: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error listing faculty records' });
  }
};

// Qualifications
export const addQualification = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can add qualifications' });

  const { degree, specialization, institution, university, yearOfPassing, percentage, certificateUrl } = req.body;

  if (!degree || !specialization || !institution || !university || !yearOfPassing || percentage === undefined) {
    return res.status(400).json({ error: 'Missing required qualification details' });
  }

  try {
    const qual = await prisma.qualification.create({
      data: {
        facultyId,
        degree,
        specialization,
        institution,
        university,
        yearOfPassing: parseInt(yearOfPassing),
        percentage: parseFloat(percentage),
        certificateUrl
      }
    });

    await logAudit(req.user!.id, 'QUALIFICATION_ADD', `Added qualification ${degree} for faculty`);
    return res.status(201).json({ qualification: qual });
  } catch (error) {
    return res.status(500).json({ error: 'Error adding qualification' });
  }
};

export const deleteQualification = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can delete qualifications' });

  try {
    const qual = await prisma.qualification.findUnique({ where: { id } });
    if (!qual || qual.facultyId !== facultyId) {
      return res.status(404).json({ error: 'Qualification not found or unauthorized' });
    }

    await prisma.qualification.delete({ where: { id } });
    await logAudit(req.user!.id, 'QUALIFICATION_DELETE', `Deleted qualification ID ${id}`);
    return res.status(200).json({ message: 'Qualification deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error deleting qualification' });
  }
};

// Experience
export const addExperience = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can add experience' });

  const { companyName, designation, fromDate, toDate, totalYears, experienceLetterUrl } = req.body;

  if (!companyName || !designation || !fromDate || !totalYears) {
    return res.status(400).json({ error: 'Missing required experience details' });
  }

  try {
    const exp = await prisma.experience.create({
      data: {
        facultyId,
        companyName,
        designation,
        fromDate: new Date(fromDate),
        toDate: toDate ? new Date(toDate) : null,
        totalYears: parseFloat(totalYears),
        experienceLetterUrl
      }
    });

    await logAudit(req.user!.id, 'EXPERIENCE_ADD', `Added experience at ${companyName}`);
    return res.status(201).json({ experience: exp });
  } catch (error) {
    return res.status(500).json({ error: 'Error adding experience record' });
  }
};

export const deleteExperience = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can delete experience' });

  try {
    const exp = await prisma.experience.findUnique({ where: { id } });
    if (!exp || exp.facultyId !== facultyId) {
      return res.status(404).json({ error: 'Experience record not found or unauthorized' });
    }

    await prisma.experience.delete({ where: { id } });
    await logAudit(req.user!.id, 'EXPERIENCE_DELETE', `Deleted experience record ID ${id}`);
    return res.status(200).json({ message: 'Experience record deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error deleting experience record' });
  }
};

// Service Requests
export const createServiceRequest = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can file support requests' });

  const { category, description, priority } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: 'Category and description are required' });
  }

  try {
    const ticket = await prisma.serviceRequest.create({
      data: {
        facultyId,
        category: category as ServiceRequestCategory,
        description,
        priority: priority || 'MEDIUM',
        status: ServiceRequestStatus.PENDING_ADMIN
      }
    });

    await logAudit(req.user!.id, 'SERVICE_REQUEST_CREATE', `Created service request ticket`);
    return res.status(201).json({ ticket });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating service request' });
  }
};

export const getServiceRequests = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let requests: any[] = [];
    if (req.user.role === 'DEAN') {
      requests = await prisma.serviceRequest.findMany({
        where: { facultyId: req.user.facultyId },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // HR / Admin see everything
      requests = await prisma.serviceRequest.findMany({
        include: {
          faculty: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading service requests' });
  }
};

export const updateServiceRequestStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, comments } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const ticket = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { faculty: true }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isAdmin = req.user!.role === 'SUPER_ADMIN' || req.user!.role === 'HR_MANAGER';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to change ticket status' });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: status as ServiceRequestStatus,
        comments: comments !== undefined ? comments : ticket.comments
      }
    });

    await logAudit(req.user!.id, 'SERVICE_REQUEST_UPDATE', `Updated ticket ${id} status to ${status}`);
    return res.status(200).json({ ticket: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating service request' });
  }
};

export const getDepartments = async (req: any, res: Response) => {
  try {
    const list = await prisma.department.findMany({
      include: {
        hod: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    return res.status(200).json({ departments: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading departments' });
  }
};

