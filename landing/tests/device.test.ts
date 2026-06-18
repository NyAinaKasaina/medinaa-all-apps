import { describe, it, expect } from 'vitest';
import { isAndroidUA, isIOSUA, detectDevice } from '@/lib/device';

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

describe('isIOSUA', () => {
  it('détecte iPhone', () => {
    expect(isIOSUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });
  it('détecte iPad', () => {
    expect(isIOSUA('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe(true);
  });
  it('détecte iPod', () => {
    expect(isIOSUA('Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)')).toBe(true);
  });
  it('renvoie false sur Android', () => {
    expect(isIOSUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe(false);
  });
  it('renvoie false sur desktop', () => {
    expect(isIOSUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120')).toBe(false);
  });
});

describe('detectDevice', () => {
  it('retourne ios pour iPhone', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
  });
  it('retourne android pour Android', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe('android');
  });
  it('retourne desktop pour un UA desktop', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120')).toBe('desktop');
  });
});
