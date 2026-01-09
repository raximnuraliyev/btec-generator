// =============================================================================
// BTEC GENERATOR - AUTH SERVICE
// =============================================================================

import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthResponse, JWTPayload } from '../types';
import { prisma } from '../lib/prisma';
import { UserStatus } from '@prisma/client';
import { initializeTokenPlan } from './token.service';

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
      status: UserStatus.ACTIVE,
    },
  });

  // Initialize token plan for new user
  const tokenPlan = await initializeTokenPlan(user.id);

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
      name: user.name,
      role: user.role,
      status: user.status,
      tokenPlan: {
        planType: tokenPlan.planType,
        tokensRemaining: tokenPlan.tokensRemaining,
        tokensPerMonth: tokenPlan.tokensPerMonth,
      },
    },
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tokenPlan: true,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is banned
  if (user.status === UserStatus.BANNED) {
    throw new Error('Your account has been banned');
  }

  // Check if user is suspended
  if (user.status === UserStatus.SUSPENDED) {
    throw new Error('Your account is temporarily suspended');
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
      name: user.name,
      role: user.role,
      status: user.status,
      tokenPlan: user.tokenPlan ? {
        planType: user.tokenPlan.planType,
        tokensRemaining: user.tokenPlan.tokensRemaining,
        tokensPerMonth: user.tokenPlan.tokensPerMonth,
      } : null,
    },
  };
};
