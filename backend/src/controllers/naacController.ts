import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { NaacContributionType } from '../utils/enums';

export const getNaacMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        qualifications: true,
        experiences: true,
        publications: true
      }
    });

    const totalFaculties = faculties.length;

    // 1. Ph.D. Holders (Criteria 2.4.2)
    const phdHolders = faculties.filter((fac: any) => {
      return fac.qualifications.some((q: any) => 
        q.degree.toLowerCase().includes('phd') || 
        q.degree.toLowerCase().includes('ph.d') ||
        q.degree.toLowerCase().includes('doctor')
      );
    }).length;

    const phdPercentage = totalFaculties > 0 ? (phdHolders / totalFaculties) * 100 : 0;

    // 2. Average Experience (Criteria 2.4.4)
    let totalExpDays = 0;
    faculties.forEach((fac: any) => {
      const joiningDate = new Date(fac.dateOfJoining);
      const diffMs = new Date().getTime() - joiningDate.getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365);
      totalExpDays += years;
    });
    const avgExperience = totalFaculties > 0 ? totalExpDays / totalFaculties : 0;

    // 3. Publications Indexing (Criteria 3.4.4)
    const journalPublications = await prisma.publication.count({
      where: { type: 'JOURNAL', status: 'APPROVED' }
    });
    const conferencePublications = await prisma.publication.count({
      where: { type: 'CONFERENCE', status: 'APPROVED' }
    });
    const booksAndChapters = await prisma.publication.count({
      where: {
        OR: [
          { type: 'BOOK' },
          { type: 'BOOK_CHAPTER' }
        ],
        status: 'APPROVED'
      }
    });

    // 4. Research Grants sum
    const grantsSum = await prisma.naacContribution.aggregate({
      where: { type: 'RESEARCH_GRANT' },
      _sum: { valueAmount: true }
    });

    const consultancySum = await prisma.naacContribution.aggregate({
      where: { type: 'CONSULTANCY' },
      _sum: { valueAmount: true }
    });

    return res.status(200).json({
      summary: {
        totalFaculties,
        phdHolders,
        phdPercentage: parseFloat(phdPercentage.toFixed(2)),
        averageExperienceYears: parseFloat(avgExperience.toFixed(2)),
        publications: {
          journal: journalPublications,
          conference: conferencePublications,
          booksChapters: booksAndChapters,
          total: journalPublications + conferencePublications + booksAndChapters
        },
        researchGrantsAmount: grantsSum._sum.valueAmount || 0,
        consultancyAmount: consultancySum._sum.valueAmount || 0
      }
    });
  } catch (error) {
    console.error('[NAAC Metrics Error]', error);
    return res.status(500).json({ error: 'Error generating NAAC metrics report' });
  }
};

export const addNaacContribution = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts can report NAAC contributions' });

  const { type, title, description, year, valueAmount, proofUrl } = req.body;

  if (!type || !title || !description || !year) {
    return res.status(400).json({ error: 'Missing required NAAC contribution fields' });
  }

  try {
    const contribution = await prisma.naacContribution.create({
      data: {
        facultyId,
        type: type as NaacContributionType,
        title,
        description,
        year: parseInt(year as string),
        valueAmount: valueAmount ? parseFloat(valueAmount) : null,
        proofUrl: proofUrl || null,
        status: 'APPROVED'
      }
    });

    await logAudit(req.user!.id, 'NAAC_CONTRIBUTION_ADD', `Logged NAAC contribution: ${title}`);
    return res.status(201).json({ contribution });
  } catch (error) {
    return res.status(500).json({ error: 'Error adding NAAC contribution record' });
  }
};

export const getNaacContributions = async (req: AuthenticatedRequest, res: Response) => {
  const { type, year } = req.query;

  try {
    const filters: any = {};
    if (type) filters.type = type as NaacContributionType;
    if (year) filters.year = parseInt(year as string);

    if (req.user!.role === 'DEAN' && req.query.self === 'true') {
      filters.facultyId = req.user!.facultyId;
    }

    const list = await prisma.naacContribution.findMany({
      where: filters,
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { code: true } }
          }
        }
      },
      orderBy: { year: 'desc' }
    });

    return res.status(200).json({ contributions: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching contributions' });
  }
};
