import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createStudentProfile = async (
  userId: string,
  fullName: string,
  universityName: string,
  faculty: string,
  groupName: string,
  city: string,
  academicYear?: string
): Promise<{ confirmed: boolean; message: string }> => {
  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    return {
      confirmed: true,
      message: 'Student profile already exists',
    };
  }

  await prisma.studentProfile.create({
    data: {
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
    message: 'Student profile created successfully',
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
