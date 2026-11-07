import { registerProfileOptions, resolveProfilesFromCliOptions } from '../cli/profile-flags';

describe('CLI Profile Flags & Tags', () => {
  it('returns undefined when no profile options or flags are specified', () => {
    const result = resolveProfilesFromCliOptions({});
    expect(result).toBeUndefined();
  });

  it('resolves direct flags: --mobile --desktop --offline --broken-links', () => {
    const result = resolveProfilesFromCliOptions({
      mobile: true,
      desktop: true,
      offline: true,
      brokenLinks: true,
    });

    expect(result).toEqual(
      expect.arrayContaining(['mobile', 'desktop', 'offline', 'broken-links'])
    );
    expect(result).toHaveLength(4);
  });

  it('resolves category shortcut flags like --a11y and --accessibility', () => {
    const a11yResult = resolveProfilesFromCliOptions({ a11y: true });
    expect(a11yResult).toEqual(
      expect.arrayContaining([
        'a11y-screenreader',
        'a11y-keyboard',
        'a11y-visual',
        'a11y-cognitive',
      ])
    );
    expect(a11yResult).toHaveLength(4);

    const accessResult = resolveProfilesFromCliOptions({ accessibility: true });
    expect(accessResult).toEqual(a11yResult);
  });

  it('resolves --resilience category shortcut', () => {
    const result = resolveProfilesFromCliOptions({
      resilience: true,
    });

    expect(result).toEqual(
      expect.arrayContaining(['offline', 'broken-links', 'network-resilience', 'form-resilience'])
    );
    expect(result).toHaveLength(4);
  });

  it('resolves --tag and --tags option with multiple tags and IDs', () => {
    const result = resolveProfilesFromCliOptions({
      tag: 'mobile,resilience,i18n',
    });

    expect(result).toContain('mobile');
    expect(result).toContain('offline');
    expect(result).toContain('broken-links');
    expect(result).toContain('i18n-rtl');
  });

  it('merges and deduplicates direct profile flags with -p / --profiles', () => {
    const result = resolveProfilesFromCliOptions({
      profiles: 'mobile,desktop',
      mobile: true,
      offline: true,
    });

    expect(result).toEqual(expect.arrayContaining(['mobile', 'desktop', 'offline']));
    expect(result).toHaveLength(3);
  });

  it('registers options onto command object chaining', () => {
    const registered: string[] = [];
    interface MockCommand {
      option(flags: string, desc?: string): this;
    }
    const mockCmd: MockCommand = {
      option(flags: string) {
        registered.push(flags);
        return this;
      },
    };

    registerProfileOptions(mockCmd);
    expect(registered.length).toBeGreaterThan(25);
    expect(registered.some((f) => f.includes('--mobile'))).toBe(true);
    expect(registered.some((f) => f.includes('--desktop'))).toBe(true);
    expect(registered.some((f) => f.includes('--a11y'))).toBe(true);
  });
});
