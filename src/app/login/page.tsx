'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { PixelBackground } from '@/components/auth/PixelBackground';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <PixelBackground />
      <div className="z-10">
        <LoginForm />
      </div>
    </main>
  );
}
