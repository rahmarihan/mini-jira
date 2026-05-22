'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/error';

export default function RegisterForm() {
  const router = useRouter();
  const {
    register,
    confirmRegistration,
    resendConfirmationCode,
    isLoading,
  } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError('Enter a valid email address');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const response = await register({ name, email, password });
      if (response.userConfirmed) {
        setSuccess(
          'Account created. Please wait for a Manager to assign your role and team.',
        );
        window.setTimeout(() => router.push('/auth/login'), 1200);
        return;
      }

      setNeedsConfirmation(true);
      setSuccess(
        'Account created. Enter the confirmation code AWS Cognito sent to your email. Please wait for a Manager to assign your role and team.',
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await confirmRegistration({
        email,
        code: confirmationCode.trim(),
      });
      setSuccess(response.message || 'Account confirmed. You can sign in now.');
      window.setTimeout(() => router.push('/auth/login'), 1200);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not confirm account'));
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);

    try {
      const response = await resendConfirmationCode(email);
      setSuccess(response.message || 'Confirmation code sent. Check your email.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not resend confirmation code'));
    }
  };

  if (needsConfirmation) {
    return (
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Confirm account</h1>
          <p className="mt-1 text-sm text-gray-500">{email}</p>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Confirmation code
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={confirmationCode}
            onChange={(event) => setConfirmationCode(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            minLength={6}
            required
          />
        </label>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Confirming...' : 'Confirm account'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resend code
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
        Confirm password
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
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
