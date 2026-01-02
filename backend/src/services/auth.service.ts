import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthResponse, JWTPayload } from '../types';

const prisma = new PrismaClient();

export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      trialTokens: user.trialTokens,
      plan: user.plan,
    },
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      trialTokens: user.trialTokens,
      plan: user.plan,
    },
  };
};
