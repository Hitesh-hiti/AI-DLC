import type {
  DomFingerprint,
} from './types.js';

export interface ScoreResult {
  score: number;
  reasons: string[];
}

export function scoreFingerprint(
  target: DomFingerprint,
  candidate: DomFingerprint
): ScoreResult {
  let score = 0;

  const reasons: string[] = [];

  if (target.tag === candidate.tag) {
    score += 0.08;
    reasons.push('tag');
  }

  if (
    target.testId &&
    candidate.testId &&
    target.testId === candidate.testId
  ) {
    score += 0.40;
    reasons.push('testId');
  }

  if (
    target.id &&
    candidate.id &&
    target.id === candidate.id
  ) {
    score += 0.20;
    reasons.push('id');
  }

  if (
    target.role &&
    candidate.role &&
    target.role === candidate.role
  ) {
    score += 0.08;
    reasons.push('role');
  }

  if (
    target.ariaLabel &&
    candidate.ariaLabel &&
    target.ariaLabel === candidate.ariaLabel
  ) {
    score += 0.12;
    reasons.push('ariaLabel');
  }

  if (
    target.placeholder &&
    candidate.placeholder &&
    target.placeholder === candidate.placeholder
  ) {
    score += 0.12;
    reasons.push('placeholder');
  }

  if (
    target.name &&
    candidate.name &&
    target.name === candidate.name
  ) {
    score += 0.10;
    reasons.push('name');
  }

  if (
    target.parentTag &&
    target.parentTag === candidate.parentTag
  ) {
    score += 0.05;
    reasons.push('parentTag');
  }

  if (
    arraysOverlap(
      target.parentClasses,
      candidate.parentClasses
    )
  ) {
    score += 0.06;
    reasons.push('parentClasses');
  }

  if (
    target.classes.length &&
    arraysOverlap(
      target.classes,
      candidate.classes
    )
  ) {
    score += 0.05;
    reasons.push('classes');
  }

  if (
    target.siblingIndex >= 0 &&
    target.siblingIndex === candidate.siblingIndex
  ) {
    score += 0.04;
    reasons.push('siblingIndex');
  }

  if (
    target.childCount === candidate.childCount
  ) {
    score += 0.03;
    reasons.push('childCount');
  }

  if (
    target.text &&
    candidate.text &&
    similarText(
      target.text,
      candidate.text
    )
  ) {
    score += 0.08;
    reasons.push('text');
  }

  return {
    score: Math.min(score, 1),
    reasons,
  };
}

function arraysOverlap(
  a: string[],
  b: string[]
): boolean {
  if (!a.length || !b.length) {
    return false;
  }

  const set = new Set(a);

  return b.some(value =>
    set.has(value)
  );
}

function similarText(
  a: string,
  b: string
): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  if (
    left.includes(right) ||
    right.includes(left)
  ) {
    return true;
  }

  return false;
}