'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../lib/profile/actions';

interface Props {
  defaultUsername: string;
}

export function SetupProfileClient({ defaultUsername }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateProfile(formData);
        if (result.error) {
          setError(result.error);
        } else {
          router.replace('/engage');
        }
      } catch {
        setError('Something went wrong saving your profile. Please try again.');
      }
    });
  }

  return (
    <div className="setup-profile-page">
      {/* Cross wordmark */}
      <div className="setup-profile-brand">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="17" y="4" width="6" height="32" rx="3" fill="var(--color-accent)" />
          <rect x="6" y="13" width="28" height="6" rx="3" fill="var(--color-accent)" />
        </svg>
        <span className="setup-profile-brand-name">The JESUS App</span>
      </div>

      <div className="setup-profile-card">
        <h1 className="setup-profile-heading">Welcome! Set up your profile</h1>
        <p className="setup-profile-sub">
          Choose a username and tell us a bit about yourself.
        </p>

        <form onSubmit={handleSubmit} className="setup-profile-form" noValidate>
          <div className="setup-field">
            <label htmlFor="username" className="setup-label">
              Username <span aria-hidden="true">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={2}
              maxLength={30}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={defaultUsername}
              placeholder="e.g. john_doe"
              className="setup-input"
            />
            <span className="setup-hint">2–30 characters, letters, numbers and underscores.</span>
          </div>

          <div className="setup-field">
            <label htmlFor="bio" className="setup-label">
              Bio <span className="setup-optional">(optional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              maxLength={200}
              rows={3}
              placeholder="A short bio about yourself…"
              className="setup-input setup-textarea"
            />
          </div>

          <div className="setup-field">
            <label htmlFor="church_name" className="setup-label">
              Church <span className="setup-optional">(optional)</span>
            </label>
            <input
              id="church_name"
              name="church_name"
              type="text"
              maxLength={100}
              placeholder="Your church name"
              className="setup-input"
            />
          </div>

          {error && <p className="setup-error" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="setup-submit"
          >
            {isPending ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>

      <style>{`
        .setup-profile-page {
          min-height: 100dvh;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 48px;
          gap: 32px;
        }

        .setup-profile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .setup-profile-brand-name {
          font-family: var(--font-display, 'Archivo Condensed', sans-serif);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.01em;
        }

        .setup-profile-card {
          width: 100%;
          max-width: 420px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setup-profile-heading {
          font-family: var(--font-display, 'Archivo Condensed', sans-serif);
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--color-text);
          margin: 0 0 4px;
          line-height: 1.1;
        }

        .setup-profile-sub {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin: 0 0 20px;
        }

        .setup-profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .setup-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .setup-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .setup-optional {
          font-weight: 400;
          color: var(--color-text-muted);
        }

        .setup-input {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--color-text);
          font-size: 1rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .setup-input:focus {
          border-color: var(--color-accent);
        }

        .setup-input::placeholder {
          color: var(--color-text-faint);
        }

        .setup-textarea {
          resize: vertical;
          min-height: 72px;
        }

        .setup-hint {
          font-size: 0.75rem;
          color: var(--color-text-faint);
        }

        .setup-error {
          font-size: 0.85rem;
          color: var(--color-error);
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          padding: 8px 12px;
          margin: 0;
        }

        .setup-submit {
          margin-top: 8px;
          background: var(--color-accent);
          color: var(--color-accent-text, #040503);
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .setup-submit:hover:not(:disabled) {
          opacity: 0.9;
        }

        .setup-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .setup-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
