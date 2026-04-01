'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Testimony } from '../../../lib/testify/types';
import { TestimonyFeed, type TestimonyFeedHandle } from '../../../libs/testify/TestimonyFeed';
import { FAB } from '../../../libs/shared-ui/FAB';

interface TestifyClientProps {
  initialTestimonies: Testimony[];
}

export function TestifyClient({ initialTestimonies }: TestifyClientProps) {
  const router = useRouter();
  const feedRef = useRef<TestimonyFeedHandle>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TestimonyFeed
        ref={feedRef}
        initialTestimonies={initialTestimonies}
        feedHeight="100%"
      />

      <FAB
        onClick={() => router.push('/testify/submit')}
        icon={<Plus size={22} color="var(--color-accent-text)" />}
        ariaLabel="Share a testimony"
      />
    </div>
  );
}
