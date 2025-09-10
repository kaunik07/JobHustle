
'use server';

import 'server-only';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const secretKey = process.env.SESSION_SECRET;
const key = new TextEncoder().encode(secretKey);

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function login(credentials: z.infer<typeof loginSchema>) {
  try {
    const validatedCredentials = loginSchema.safeParse(credentials);
    if (!validatedCredentials.success) {
      return { success: false, error: 'Invalid credentials format.' };
    }
    const { username, password } = validatedCredentials.data;

    const user = await db.query.users.findFirst({
      where: eq(users.firstName, username),
    });

    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // In a real app, you'd compare a hashed password.
    // For this implementation, we're comparing plain text as requested.
    if (user.password !== password) {
      return { success: false, error: 'Invalid password.' };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await new SignJWT({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(key);

    cookies().set('session', session, { expires, httpOnly: true });
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}

export async function signup(data: z.infer<typeof signupSchema>) {
  try {
    const validatedData = signupSchema.safeParse(data);
    if (!validatedData.success) {
      return { success: false, error: 'Invalid data format.' };
    }

    const { username, email, password } = validatedData.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.defaultEmail, email),
    });

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    // In a real app, hash the password before saving
    await db.insert(users).values({
      firstName: username,
      lastName: username,
      emailAddresses: [email],
      defaultEmail: email,
      password, // Storing plain text as requested
    });

    return { success: true };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
  redirect('/login');
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return { isLoggedIn: false };

  try {
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256'],
    });
    return { isLoggedIn: true, user: payload as { id: string; firstName: string; lastName: string } };
  } catch (error) {
    return { isLoggedIn: false };
  }
}

