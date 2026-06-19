import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { PublicationType, PatentStatus } from '../utils/enums';

export const addPublication = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts can upload publications' });

  const { type, title, journalBookName, volume, issue, pages, year, doi, link, proofUrl, criteriaNaac } = req.body;

  if (!type || !title || !journalBookName || !year) {
    return res.status(400).json({ error: 'Type, title, journal/book name, and year are required' });
  }

  try {
    const pub = await prisma.publication.create({
      data: {
        facultyId,
        type: type as PublicationType,
        title,
        journalBookName,
        volume: volume || null,
        issue: issue || null,
        pages: pages || null,
        year: parseInt(year as string),
        doi: doi || null,
        link: link || null,
        proofUrl: proofUrl || null,
        criteriaNaac: criteriaNaac || null,
        status: 'PENDING'
      }
    });

    await logAudit(req.user!.id, 'PUBLICATION_ADD', `Added publication: ${title}`);
    return res.status(201).json({ publication: pub });
  } catch (error) {
    console.error('[Add Pub Error]', error);
    return res.status(500).json({ error: 'Error adding publication' });
  }
};

export const getPublications = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { facultyId, departmentId, year, type, status } = req.query;

  try {
    const filters: any = {};

    if (req.user.role === 'DEAN' && req.query.self === 'true') {
      filters.facultyId = req.user.facultyId;
    } else {
      if (facultyId) filters.facultyId = facultyId as string;
      if (departmentId) {
        filters.faculty = { departmentId: departmentId as string };
      }
    }

    if (year) filters.year = parseInt(year as string);
    if (type) filters.type = type as PublicationType;
    if (status) filters.status = status as string;

    const list = await prisma.publication.findMany({
      where: filters,
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: { year: 'desc' }
    });

    return res.status(200).json({ publications: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching publications' });
  }
};

export const updatePublicationStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, criteriaNaac } = req.body; // 'APPROVED' or 'REJECTED'

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const pub = await prisma.publication.findUnique({ where: { id } });
    if (!pub) return res.status(404).json({ error: 'Publication not found' });

    const updated = await prisma.publication.update({
      where: { id },
      data: {
        status,
        criteriaNaac: criteriaNaac !== undefined ? criteriaNaac : pub.criteriaNaac
      }
    });

    // Mirror to NAAC contribution list if approved
    if (status === 'APPROVED') {
      await prisma.naacContribution.create({
        data: {
          facultyId: pub.facultyId,
          type: 'PUBLICATION',
          title: pub.title,
          description: `Published in ${pub.journalBookName}. DOI: ${pub.doi || 'N/A'}`,
          year: pub.year,
          status: 'APPROVED',
          proofUrl: pub.proofUrl
        }
      });
    }

    await logAudit(req.user!.id, 'PUBLICATION_STATUS_UPDATE', `Updated publication ${id} status to ${status}`);
    return res.status(200).json({ publication: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating publication status' });
  }
};

export const addPatent = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts can upload patents' });

  const { title, applicationNumber, filingDate, status, proofUrl } = req.body;

  if (!title || !applicationNumber || !filingDate) {
    return res.status(400).json({ error: 'Title, application number, and filing date are required' });
  }

  try {
    const patent = await prisma.patent.create({
      data: {
        facultyId,
        title,
        applicationNumber,
        filingDate: new Date(filingDate),
        status: (status as PatentStatus) || PatentStatus.FILED,
        proofUrl: proofUrl || null
      }
    });

    await logAudit(req.user!.id, 'PATENT_ADD', `Added patent: ${title}`);
    return res.status(201).json({ patent });
  } catch (error) {
    console.error('[Add Patent Error]', error);
    return res.status(500).json({ error: 'Error adding patent' });
  }
};

export const getPatents = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { facultyId, status } = req.query;

  try {
    const filters: any = {};

    if (req.user.role === 'DEAN' && req.query.self === 'true') {
      filters.facultyId = req.user.facultyId;
    } else {
      if (facultyId) filters.facultyId = facultyId as string;
    }

    if (status) filters.status = status as PatentStatus;

    const list = await prisma.patent.findMany({
      where: filters,
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: { filingDate: 'desc' }
    });

    return res.status(200).json({ patents: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading patents' });
  }
};

export const updatePatentStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, grantDate, proofUrl } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const patent = await prisma.patent.findUnique({ where: { id } });
    if (!patent) return res.status(404).json({ error: 'Patent not found' });

    const updated = await prisma.patent.update({
      where: { id },
      data: {
        status: status as PatentStatus,
        grantDate: grantDate ? new Date(grantDate) : patent.grantDate,
        proofUrl: proofUrl !== undefined ? proofUrl : patent.proofUrl
      }
    });

    await logAudit(req.user!.id, 'PATENT_STATUS_UPDATE', `Updated patent ${id} status to ${status}`);
    return res.status(200).json({ patent: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating patent status' });
  }
};

export const getResearchReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Publications by year
    const publications = await prisma.publication.findMany();
    const patents = await prisma.patent.findMany();

    const yearStats: any = {};
    publications.forEach((pub: any) => {
      const year = pub.year;
      if (!yearStats[year]) {
        yearStats[year] = { year, journal: 0, conference: 0, book: 0, bookChapter: 0, total: 0 };
      }
      if (pub.type === PublicationType.JOURNAL) yearStats[year].journal++;
      else if (pub.type === PublicationType.CONFERENCE) yearStats[year].conference++;
      else if (pub.type === PublicationType.BOOK) yearStats[year].book++;
      else if (pub.type === PublicationType.BOOK_CHAPTER) yearStats[year].bookChapter++;
      
      yearStats[year].total++;
    });

    const patentStats = {
      filed: patents.filter((p: any) => p.status === PatentStatus.FILED).length,
      published: patents.filter((p: any) => p.status === PatentStatus.PUBLISHED).length,
      granted: patents.filter((p: any) => p.status === PatentStatus.GRANTED).length
    };

    return res.status(200).json({
      yearlyPublications: Object.values(yearStats).sort((a: any, b: any) => b.year - a.year),
      patentsSummary: patentStats
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating research reports' });
  }
};
