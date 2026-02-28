export async function checkTone(
  content: string
): Promise<{ pass: boolean; suggestion?: string }> {
  try {
    const res = await fetch('/api/tone-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return { pass: true };
    return (await res.json()) as { pass: boolean; suggestion?: string };
  } catch {
    return { pass: true };
  }
}
