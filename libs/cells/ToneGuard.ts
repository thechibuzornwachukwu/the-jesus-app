export async function checkTone(
  content: string,
  cellId?: string
): Promise<{ pass: boolean; suggestion?: string; hardBlock?: boolean; message?: string }> {
  try {
    const res = await fetch('/api/tone-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, cellId }),
    });
    if (!res.ok) return { pass: true };
    return (await res.json()) as {
      pass: boolean;
      suggestion?: string;
      hardBlock?: boolean;
      message?: string;
    };
  } catch {
    return { pass: true };
  }
}
