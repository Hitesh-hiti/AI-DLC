import crypto from 'node:crypto';

import type { Locator } from '@playwright/test';

import type { DomFingerprint } from './types.js';

export async function fingerprintLocator(
  locator: Locator
): Promise<DomFingerprint> {
  return locator.evaluate((element: HTMLElement) => {
    const el = element as HTMLElement;

    const attributes: Record<string, string> = {};

    for (const attribute of Array.from(el.attributes)) {
      const name = attribute.name;

      if (
        name === 'class' ||
        name === 'style'
      ) {
        continue;
      }

      attributes[name] = attribute.value;
    }

    const parent = el.parentElement;

    const parentSignature = parent
      ? Array.from(parent.children)
          .slice(0, 10)
          .map(child => {
            const childElement =
              child as HTMLElement;

            return {
              tag:
                childElement.tagName.toLowerCase(),

              testId:
                childElement.getAttribute(
                  'data-testid'
                ) ?? undefined,

              role:
                childElement.getAttribute(
                  'role'
                ) ?? undefined,

              text:
                normalizeText(
                  childElement.textContent ?? ''
                ).slice(0, 160) || undefined,
            };
          })
      : [];

    const siblings = parent
      ? Array.from(parent.children)
      : [];

    const siblingIndex = siblings.indexOf(el);

    const ariaLabel =
      el.getAttribute('aria-label') ??
      undefined;

    const role =
      el.getAttribute('role') ??
      undefined;

    const placeholder =
      el.getAttribute('placeholder') ??
      undefined;

    const name =
      el.getAttribute('name') ??
      undefined;

    const id =
      el.getAttribute('id') ??
      undefined;

    const testId =
      el.getAttribute('data-testid') ??
      undefined;

    return {
      tag: el.tagName.toLowerCase(),

      testId,
      id,
      role,
      ariaLabel,
      placeholder,
      name,

      text:
        normalizeText(el.textContent ?? '')
          .slice(0, 300) || undefined,

      classes:
        Array.from(el.classList).slice(0, 20),

      parentTag:
        parent?.tagName.toLowerCase() ?? '',

      parentClasses:
        parent
          ? Array.from(parent.classList).slice(0, 20)
          : [],

      childCount:
        el.children.length,

      siblingIndex,

      attributes,

      parentSignature,
    };
  });
}

function normalizeText(
  value: string
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

export function fingerprintHash(
  fingerprint: DomFingerprint
): string {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify(fingerprint)
    )
    .digest('hex');
}

export function fingerprintSelector(
  fingerprint: DomFingerprint
): string | null {
  const tag = fingerprint.tag || '*';

  if (
    fingerprint.parentTag &&
    fingerprint.parentClasses.length
  ) {
    const parentClass =
      fingerprint.parentClasses
        .map(escapeCss)
        .join('.');

    return `${tag}:is(.${parentClass})`;
  }

  if (fingerprint.classes.length) {
    const classes =
      fingerprint.classes
        .map(escapeCss)
        .join('.');

    return `${tag}.${classes}`;
  }

  return tag;
}

function escapeCss(
  value: string
): string {
  return value.replace(
    /([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
    '\\$1'
  );
}