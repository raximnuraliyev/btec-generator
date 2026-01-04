// =============================================================================
// BTEC GENERATOR - STUDENT SERVICE
// =============================================================================

import { prisma } from '../lib/prisma';

export const createStudentProfile = async (
  userId: string,
  fullName: string,
  universityName: string,
  faculty: string,
  groupName: string,
  city: string,
  academicYear?: string
): Promise<{ confirmed: boolean; message: string; profile: any }> => {
  // Use upsert to handle both create and update
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    update: {
      fullName,
      universityName,
      faculty,
      groupName,
      city,
      academicYear,
    },
    create: {
      userId,
      fullName,
      universityName,
      faculty,
      groupName,
      city,
      academicYear,
    },
  });

  return {
    confirmed: true,
    message: 'Student profile saved successfully',
    profile,
  };
};

export const getStudentProfile = async (
  userId: string
): Promise<{
  confirmed: boolean;
  profile?: {
    fullName: string;
    universityName: string;
    faculty: string;
    groupName: string;
    city: string;
    academicYear?: string | null;
  };
}> => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return { confirmed: false };
  }

  return {
    confirmed: true,
    profile: {
      fullName: profile.fullName,
      universityName: profile.universityName,
      faculty: profile.faculty,
      groupName: profile.groupName,
      city: profile.city,
      academicYear: profile.academicYear,
    },
  };
};

export const updateStudentProfile = async (
  userId: string,
  data: {
    fullName?: string;
    universityName?: string;
    faculty?: string;
    groupName?: string;
    city?: string;
    academicYear?: string;
  }
): Promise<{ confirmed: boolean; message: string }> => {
  await prisma.studentProfile.update({
    where: { userId },
    data,
  });

  return {
    confirmed: true,
    message: 'Student profile updated successfully',
  };
};
