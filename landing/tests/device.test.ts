import { describe, it, expect } from 'vitest';
import { isAndroidUA } from '@/lib/device';

describe('isAndroidUA', () => {
  it('détecte Android', () => {
    expect(isAndroidUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe(true);
  });
  it('exclut Windows Phone', () => {
    expect(isAndroidUA('Mozilla/5.0 (Windows Phone 10; Android)')).toBe(false);
  });
  it('renvoie false sur iPhone', () => {
    expect(isAndroidUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(false);
  });
});
