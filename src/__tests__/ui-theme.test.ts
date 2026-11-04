import { HOUSE_WINDOWS } from '@/app/components/features/HauntedHouse';
import { WispState } from '@/app/components/features/WispGhost';
import { AtmosphereLevel } from '@/app/components/features/AtmosphereLayer';

describe('Halloween UI Theme & Components', () => {
  describe('HauntedHouse Window Mapping', () => {
    it('defines 17 windows across all three floors of the mansion', () => {
      expect(HOUSE_WINDOWS).toHaveLength(17);

      const atticWindows = HOUSE_WINDOWS.filter((w) => w.floor === 'attic');
      const upperWindows = HOUSE_WINDOWS.filter((w) => w.floor === 'upper');
      const groundWindows = HOUSE_WINDOWS.filter((w) => w.floor === 'ground');

      expect(atticWindows.length).toBe(5);
      expect(upperWindows.length).toBe(6);
      expect(groundWindows.length).toBe(6);
    });

    it('ensures each window has a unique ID and non-empty name', () => {
      const ids = new Set<string>();
      HOUSE_WINDOWS.forEach((win) => {
        expect(win.id).toBeTruthy();
        expect(win.name).toBeTruthy();
        expect(ids.has(win.id)).toBe(false);
        ids.add(win.id);
      });
    });

    it('positions all windows safely within the 540x460 mansion viewBox', () => {
      HOUSE_WINDOWS.forEach((win) => {
        expect(win.x).toBeGreaterThan(0);
        expect(win.x + win.width).toBeLessThanOrEqual(540);
        expect(win.y).toBeGreaterThan(0);
        expect(win.y + win.height).toBeLessThanOrEqual(460);
      });
    });
  });

  describe('Wisp State Vocabulary', () => {
    it('supports all required reactive states for the ghost host', () => {
      const states: WispState[] = [
        'idle',
        'curious',
        'pleased',
        'conjuring',
        'delighted',
        'alarmed',
        'napping',
        'wary',
      ];

      expect(states).toContain('idle');
      expect(states).toContain('alarmed');
      expect(states).toContain('delighted');
      expect(states).toContain('conjuring');
    });
  });

  describe('Atmosphere Ambiance Levels', () => {
    it('defines three distinct atmosphere levels respecting accessibility', () => {
      const levels: AtmosphereLevel[] = ['off', 'subtle', 'full'];
      expect(levels).toHaveLength(3);
      expect(levels).toContain('off'); // Accessibility floor
      expect(levels).toContain('subtle');
      expect(levels).toContain('full');
    });
  });

  describe('Lexicon & Severity Mappings (AGENTS.md §3.4)', () => {
    const SEVERITY_LORE = {
      error: { lore: 'Scream', label: 'Serious' },
      warning: { lore: 'Chill', label: 'Warning' },
      info: { lore: 'Whisper', label: 'Info' },
    } as const;

    it('maps error to Scream / Serious', () => {
      expect(SEVERITY_LORE.error.lore).toBe('Scream');
      expect(SEVERITY_LORE.error.label).toBe('Serious');
    });

    it('maps warning to Chill / Warning', () => {
      expect(SEVERITY_LORE.warning.lore).toBe('Chill');
      expect(SEVERITY_LORE.warning.label).toBe('Warning');
    });

    it('maps info to Whisper / Info', () => {
      expect(SEVERITY_LORE.info.lore).toBe('Whisper');
      expect(SEVERITY_LORE.info.label).toBe('Info');
    });
  });
});
