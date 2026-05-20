'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/error';
import type { TeamId } from '../../types/user';

type EmployeeTeamId = Extract<TeamId, 'Frontend' | 'Backend'>;

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamId, setTeamId] = useState<EmployeeTeamId>('Frontend');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await register({ name, email, password, teamId });
      setSuccess(response.message || 'Registration succeeded. You can sign in now.');
      window.setTimeout(() => router.push('/auth/login'), 1200);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Register</h1>
        <p className="mt-1 text-sm text-gray-500">Employee accounts only</p>
      </div>

      <label className="block text-sm font-medium text-gray-700">
        Name
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Email
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Password
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Team
        <select
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value as EmployeeTeamId)}
        >
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
        </select>
      </label>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      <button
        type="button"
        onClick={() => router.push('/auth/login')}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Back to sign in
      </button>
    </form>
  );
}
