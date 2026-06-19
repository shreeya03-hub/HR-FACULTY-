import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';
import { Role } from '../utils/enums';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_university_jwt_key_123_abc';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_university_refresh_jwt_key_987_xyz';

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, role, firstName, lastName, phone, departmentId, designation, dateOfJoining, dateOfBirth, gender } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: role as Role,
          firstName,
          lastName,
          phone
        }
      });

      // If registering as DEAN or HR_MANAGER, we also create their Faculty details profile
      if (role === 'DEAN' || role === 'HR_MANAGER') {
        if (!departmentId || !designation) {
          throw new Error('Department and designation are required for faculty/dean/hr accounts');
        }

        const faculty = await tx.faculty.create({
          data: {
            userId: newUser.id,
            departmentId,
            designation,
            dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1),
            gender: gender || 'Male',
            basicPay: 50000.0 // default basic pay
          }
        });

        // Initialize default leave balance for this year
        await tx.leaveBalance.create({
          data: {
            facultyId: faculty.id,
            year: new Date().getFullYear(),
            casualLeave: 12,
            sickLeave: 10,
            earnedLeave: 15,
            dutyLeave: 10,
            maternityLeave: gender?.toLowerCase() === 'female' ? 180 : 0
          }
        });
      }

      return newUser;
    });

    await logAudit(user.id, 'USER_REGISTER', `User ${user.email} registered successfully as ${role}`);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error: any) {
    console.error('[Registration Error]', error);
    return res.status(500).json({ error: error.message || 'Error registering user' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { faculty: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const facultyId = user.faculty?.id || undefined;

    // Tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, facultyId },
      JWT_SECRET,
      { expiresIn: '24h' } // long token for dev ease, or 1h in production
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(user.id, 'USER_LOGIN', `User ${user.email} logged in successfully`);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        facultyId
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { faculty: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or suspended' });
    }

    const facultyId = user.faculty?.id || undefined;

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, facultyId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        faculty: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error fetching profile' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    await logAudit(user.id, 'USER_PASSWORD_CHANGE', `User ${user.email} changed password`);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error updating password' });
  }
};
