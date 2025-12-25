export function calculateConfidence(input: {
  languages: string[];
  frameworks: string[];
  entry: any;
}) {
  let score = 0;

  if (input.languages.length) score += 0.3;
  if (input.frameworks.length) score += 0.3;
  if (input.entry.start) score += 0.2;
  if (input.entry.build) score += 0.2;

  return Math.min(score, 0.99);
}
