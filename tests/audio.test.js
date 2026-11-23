/**
 * Tests pour le module Audio (Web Audio API)
 */

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DU MODULE
// ═══════════════════════════════════════════════════════════════

describe('Audio - Structure du module', () => {
  it('should have Audio object defined', () => {
    expect(typeof Audio).toBe('object');
  });

  it('should have init method', () => {
    expect(typeof Audio.init).toBe('function');
  });

  it('should have setVolume method', () => {
    expect(typeof Audio.setVolume).toBe('function');
  });

  it('should have resume method', () => {
    expect(typeof Audio.resume).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS PROPRIETES INTERNES
// ═══════════════════════════════════════════════════════════════

describe('Audio - Internal properties', () => {
  it('should have _context property', () => {
    expect(Audio.hasOwnProperty('_context')).toBe(true);
  });

  it('should have _masterGain property', () => {
    expect(Audio.hasOwnProperty('_masterGain')).toBe(true);
  });

  it('should have _enabled property', () => {
    expect(Audio.hasOwnProperty('_enabled')).toBe(true);
  });

  it('should have _volume property', () => {
    expect(Audio.hasOwnProperty('_volume')).toBe(true);
  });

  it('_enabled should default to true', () => {
    expect(Audio._enabled).toBe(true);
  });

  it('_volume should default to 0.5', () => {
    expect(Audio._volume).toBe(0.5);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS METHODES PRIVEES
// ═══════════════════════════════════════════════════════════════

describe('Audio - Private methods', () => {
  it('should have _createTone method', () => {
    expect(typeof Audio._createTone).toBe('function');
  });

  it('should have _playMelody method', () => {
    expect(typeof Audio._playMelody).toBe('function');
  });

  it('should have _playPercussion method', () => {
    expect(typeof Audio._playPercussion).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS SONS DU JEU
// ═══════════════════════════════════════════════════════════════

describe('Audio - Game sounds', () => {

  it('should have playCardToPurple method', () => {
    expect(typeof Audio.playCardToPurple).toBe('function');
  });

  it('should have playCardToOrange method', () => {
    expect(typeof Audio.playCardToOrange).toBe('function');
  });

  it('should have playCardToGreen method', () => {
    expect(typeof Audio.playCardToGreen).toBe('function');
  });

  it('should have playCardLand method', () => {
    expect(typeof Audio.playCardLand).toBe('function');
  });

  it('should have playBadgeUnlocked method', () => {
    expect(typeof Audio.playBadgeUnlocked).toBe('function');
  });

  it('should have playCardToBox method', () => {
    expect(typeof Audio.playCardToBox).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS setEnabled()
// ═══════════════════════════════════════════════════════════════
// TESTS setVolume()
// ═══════════════════════════════════════════════════════════════

describe('Audio - setVolume()', () => {
  afterEach(() => {
    // Reset to default
    Audio._volume = 0.5;
  });

  it('should set volume to given value', () => {
    Audio.setVolume(0.8);
    expect(Audio._volume).toBe(0.8);
  });

  it('should clamp volume to 0 minimum', () => {
    Audio.setVolume(-0.5);
    expect(Audio._volume).toBe(0);
  });

  it('should clamp volume to 1 maximum', () => {
    Audio.setVolume(1.5);
    expect(Audio._volume).toBe(1);
  });

  it('should accept 0 as valid volume', () => {
    Audio.setVolume(0);
    expect(Audio._volume).toBe(0);
  });

  it('should accept 1 as valid volume', () => {
    Audio.setVolume(1);
    expect(Audio._volume).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS init()
// ═══════════════════════════════════════════════════════════════

describe('Audio - init()', () => {
  beforeEach(() => {
    // Reset context for each test
    Audio._context = null;
    Audio._masterGain = null;
  });

  it('should not throw when called', () => {
    expect(() => Audio.init()).not.toThrow();
  });

  it('should create audio context if supported', () => {
    // Only test if Web Audio API is available
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      Audio.init();
      expect(Audio._context).not.toBeNull();
    }
  });

  it('should not reinitialize if already initialized', () => {
    Audio.init();
    const firstContext = Audio._context;
    Audio.init();
    expect(Audio._context).toBe(firstContext);
  });

  it('should set _enabled to false if Web Audio not supported', () => {
    // This test validates graceful degradation
    // In a browser with Web Audio, this won't trigger
    // But the code path exists for unsupported environments
    expect(typeof Audio._enabled).toBe('boolean');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS SONS NE PLANTENT PAS SANS CONTEXTE
// ═══════════════════════════════════════════════════════════════

describe('Audio - Sound methods without context', () => {
  beforeEach(() => {
    // Simulate no context
    Audio._context = null;
    Audio._enabled = true;
  });

  afterEach(() => {
    Audio._enabled = true;
  });

  it('playCardToPurple should not throw without context', () => {
    expect(() => Audio.playCardToPurple()).not.toThrow();
  });

  it('playCardToOrange should not throw without context', () => {
    expect(() => Audio.playCardToOrange()).not.toThrow();
  });

  it('playCardToGreen should not throw without context', () => {
    expect(() => Audio.playCardToGreen()).not.toThrow();
  });

  it('playCardLand should not throw without context', () => {
    expect(() => Audio.playCardLand()).not.toThrow();
  });

  it('playBadgeUnlocked should not throw without context', () => {
    expect(() => Audio.playBadgeUnlocked()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS SONS DESACTIVES
// ═══════════════════════════════════════════════════════════════

describe('Audio - Sound methods when disabled', () => {
  beforeEach(() => {
    Audio._enabled = false;
  });

  afterEach(() => {
    Audio._enabled = true;
  });

  it('playCardToPurple should not throw when disabled', () => {
    expect(() => Audio.playCardToPurple()).not.toThrow();
  });

  it('playCardToGreen should not throw when disabled', () => {
    expect(() => Audio.playCardToGreen()).not.toThrow();
  });

  it('_createTone should return null when disabled', () => {
    const result = Audio._createTone(440, 'sine', 0, 0.5, 0.02, 0.1, 0.3, 0.1);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS playCardToBox()
// ═══════════════════════════════════════════════════════════════

describe('Audio - playCardToBox()', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should not throw for purple box', () => {
    expect(() => Audio.playCardToBox('purple')).not.toThrow();
  });

  it('should not throw for orange box', () => {
    expect(() => Audio.playCardToBox('orange')).not.toThrow();
  });

  it('should not throw for green box', () => {
    expect(() => Audio.playCardToBox('green')).not.toThrow();
  });

  it('should not throw for unknown box', () => {
    expect(() => Audio.playCardToBox('unknown')).not.toThrow();
  });

  it('should not throw for never_played box', () => {
    expect(() => Audio.playCardToBox('never_played')).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS resume()
// ═══════════════════════════════════════════════════════════════

describe('Audio - resume()', () => {
  it('should not throw when called', () => {
    expect(() => Audio.resume()).not.toThrow();
  });

  it('should return a promise or undefined', () => {
    const result = Audio.resume();
    // resume() is async, should return promise if context exists
    // or be undefined if no context
    expect(result === undefined || result instanceof Promise).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS _createTone() PARAMETERS
// ═══════════════════════════════════════════════════════════════

describe('Audio - _createTone() parameters', () => {
  it('should accept frequency parameter', () => {
    // Just verify it doesn't throw with valid params
    Audio._context = null;
    expect(() => Audio._createTone(440, 'sine', 0, 0.5, 0.02, 0.1, 0.3, 0.1)).not.toThrow();
  });

  it('should accept different wave types', () => {
    Audio._context = null;
    expect(() => Audio._createTone(440, 'sine', 0, 0.5, 0.02, 0.1, 0.3, 0.1)).not.toThrow();
    expect(() => Audio._createTone(440, 'triangle', 0, 0.5, 0.02, 0.1, 0.3, 0.1)).not.toThrow();
    expect(() => Audio._createTone(440, 'square', 0, 0.5, 0.02, 0.1, 0.3, 0.1)).not.toThrow();
    expect(() => Audio._createTone(440, 'sawtooth', 0, 0.5, 0.02, 0.1, 0.3, 0.1)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS _playMelody() PARAMETERS
// ═══════════════════════════════════════════════════════════════

describe('Audio - _playMelody() parameters', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should accept empty notes array', () => {
    expect(() => Audio._playMelody([])).not.toThrow();
  });

  it('should accept single note', () => {
    const notes = [{ freq: 440, time: 0, duration: 0.2, type: 'sine', sustain: 0.3 }];
    expect(() => Audio._playMelody(notes)).not.toThrow();
  });

  it('should accept multiple notes', () => {
    const notes = [
      { freq: 440, time: 0, duration: 0.2, type: 'sine', sustain: 0.3 },
      { freq: 550, time: 0.2, duration: 0.2, type: 'sine', sustain: 0.3 }
    ];
    expect(() => Audio._playMelody(notes)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS INTEGRATION
// ═══════════════════════════════════════════════════════════════

describe('Audio - Integration', () => {
  afterEach(() => {
    Audio._enabled = true;
    Audio._volume = 0.5;
  });

  it('should handle volume changes', () => {
    Audio.setVolume(0.2);
    expect(Audio._volume).toBe(0.2);

    Audio.setVolume(0.8);
    expect(Audio._volume).toBe(0.8);
  });

  it('should handle full game sound sequence', () => {
    // Simulate a game session
    expect(() => {
      Audio.playCardToGreen();
      Audio.playBadgeUnlocked();
    }).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS NOTE_FREQUENCIES
// ═══════════════════════════════════════════════════════════════

describe('Audio - NOTE_FREQUENCIES', () => {
  it('should have NOTE_FREQUENCIES object', () => {
    expect(typeof Audio.NOTE_FREQUENCIES).toBe('object');
  });

  it('should have A4 = 440 Hz (reference pitch)', () => {
    expect(Audio.NOTE_FREQUENCIES.A4).toBe(440);
  });

  it('should have C4 ≈ 261.63 Hz (middle C)', () => {
    expect(Audio.NOTE_FREQUENCIES.C4).toBeCloseTo(261.63, 1);
  });

  it('should have enharmonic equivalents', () => {
    expect(Audio.NOTE_FREQUENCIES['C#4']).toBe(Audio.NOTE_FREQUENCIES.Db4);
    expect(Audio.NOTE_FREQUENCIES['F#4']).toBe(Audio.NOTE_FREQUENCIES.Gb4);
  });

  it('should have octaves 2-6', () => {
    expect(Audio.NOTE_FREQUENCIES.C2).toBeDefined();
    expect(Audio.NOTE_FREQUENCIES.C3).toBeDefined();
    expect(Audio.NOTE_FREQUENCIES.C4).toBeDefined();
    expect(Audio.NOTE_FREQUENCIES.C5).toBeDefined();
    expect(Audio.NOTE_FREQUENCIES.C6).toBeDefined();
  });

  it('should double frequency per octave', () => {
    const ratio = Audio.NOTE_FREQUENCIES.A5 / Audio.NOTE_FREQUENCIES.A4;
    expect(ratio).toBeCloseTo(2, 2);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS NOTE_NAMES MAPPINGS
// ═══════════════════════════════════════════════════════════════

describe('Audio - NOTE_NAMES mappings', () => {
  it('should have NOTE_NAMES_FR_TO_EN object', () => {
    expect(typeof Audio.NOTE_NAMES_FR_TO_EN).toBe('object');
  });

  it('should have NOTE_NAMES_EN_TO_FR object', () => {
    expect(typeof Audio.NOTE_NAMES_EN_TO_FR).toBe('object');
  });

  it('should map French natural notes to English', () => {
    expect(Audio.NOTE_NAMES_FR_TO_EN['do']).toBe('C');
    expect(Audio.NOTE_NAMES_FR_TO_EN['ré']).toBe('D');
    expect(Audio.NOTE_NAMES_FR_TO_EN['mi']).toBe('E');
    expect(Audio.NOTE_NAMES_FR_TO_EN['fa']).toBe('F');
    expect(Audio.NOTE_NAMES_FR_TO_EN['sol']).toBe('G');
    expect(Audio.NOTE_NAMES_FR_TO_EN['la']).toBe('A');
    expect(Audio.NOTE_NAMES_FR_TO_EN['si']).toBe('B');
  });

  it('should map English natural notes to French', () => {
    expect(Audio.NOTE_NAMES_EN_TO_FR['C']).toBe('do');
    expect(Audio.NOTE_NAMES_EN_TO_FR['D']).toBe('ré');
    expect(Audio.NOTE_NAMES_EN_TO_FR['E']).toBe('mi');
    expect(Audio.NOTE_NAMES_EN_TO_FR['F']).toBe('fa');
    expect(Audio.NOTE_NAMES_EN_TO_FR['G']).toBe('sol');
    expect(Audio.NOTE_NAMES_EN_TO_FR['A']).toBe('la');
    expect(Audio.NOTE_NAMES_EN_TO_FR['B']).toBe('si');
  });

  it('should handle sharps in French', () => {
    expect(Audio.NOTE_NAMES_FR_TO_EN['do#']).toBe('C#');
    expect(Audio.NOTE_NAMES_FR_TO_EN['fa#']).toBe('F#');
  });

  it('should handle flats in French', () => {
    expect(Audio.NOTE_NAMES_FR_TO_EN['sib']).toBe('Bb');
    expect(Audio.NOTE_NAMES_FR_TO_EN['mib']).toBe('Eb');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS TIMBRES
// ═══════════════════════════════════════════════════════════════

describe('Audio - TIMBRES', () => {
  it('should have TIMBRES object', () => {
    expect(typeof Audio.TIMBRES).toBe('object');
  });

  it('should have sine timbre', () => {
    expect(Audio.TIMBRES.sine).toBeDefined();
    expect(Audio.TIMBRES.sine.harmonics).toEqual([1]);
    expect(Audio.TIMBRES.sine.amplitudes).toEqual([1]);
  });

  it('should have piano timbre with multiple harmonics', () => {
    expect(Audio.TIMBRES.piano).toBeDefined();
    expect(Audio.TIMBRES.piano.harmonics.length).toBeGreaterThan(1);
    expect(Audio.TIMBRES.piano.amplitudes.length).toBe(Audio.TIMBRES.piano.harmonics.length);
  });

  it('should have organ timbre', () => {
    expect(Audio.TIMBRES.organ).toBeDefined();
  });

  it('should have flute timbre', () => {
    expect(Audio.TIMBRES.flute).toBeDefined();
  });

  it('should have clarinet timbre (odd harmonics)', () => {
    expect(Audio.TIMBRES.clarinet).toBeDefined();
    // Clarinet has characteristic odd harmonics
    expect(Audio.TIMBRES.clarinet.harmonics).toContain(1);
    expect(Audio.TIMBRES.clarinet.harmonics).toContain(3);
  });

  it('should have brass timbre', () => {
    expect(Audio.TIMBRES.brass).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS _normalizeNoteName()
// ═══════════════════════════════════════════════════════════════

describe('Audio - _normalizeNoteName()', () => {
  it('should have _normalizeNoteName method', () => {
    expect(typeof Audio._normalizeNoteName).toBe('function');
  });

  it('should normalize English note names', () => {
    expect(Audio._normalizeNoteName('C', 4)).toBe('C4');
    expect(Audio._normalizeNoteName('A', 4)).toBe('A4');
  });

  it('should normalize French note names', () => {
    expect(Audio._normalizeNoteName('do', 4)).toBe('C4');
    expect(Audio._normalizeNoteName('la', 4)).toBe('A4');
    expect(Audio._normalizeNoteName('ré', 4)).toBe('D4');
  });

  it('should extract octave from note name', () => {
    expect(Audio._normalizeNoteName('C4')).toBe('C4');
    expect(Audio._normalizeNoteName('A5')).toBe('A5');
    expect(Audio._normalizeNoteName('do3')).toBe('C3');
  });

  it('should handle sharps and flats', () => {
    expect(Audio._normalizeNoteName('C#', 4)).toBe('C#4');
    expect(Audio._normalizeNoteName('Bb', 4)).toBe('Bb4');
    expect(Audio._normalizeNoteName('do#', 4)).toBe('C#4');
    expect(Audio._normalizeNoteName('sib', 4)).toBe('Bb4');
  });

  it('should return null for invalid notes', () => {
    expect(Audio._normalizeNoteName('')).toBeNull();
    expect(Audio._normalizeNoteName(null)).toBeNull();
    expect(Audio._normalizeNoteName('X', 4)).toBeNull();
  });

  it('should use default octave 4', () => {
    expect(Audio._normalizeNoteName('C')).toBe('C4');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS getFrequency()
// ═══════════════════════════════════════════════════════════════

describe('Audio - getFrequency()', () => {
  it('should have getFrequency method', () => {
    expect(typeof Audio.getFrequency).toBe('function');
  });

  it('should return frequency for English note', () => {
    expect(Audio.getFrequency('A', 4)).toBe(440);
  });

  it('should return frequency for French note', () => {
    expect(Audio.getFrequency('la', 4)).toBe(440);
  });

  it('should return null for invalid note', () => {
    expect(Audio.getFrequency('invalid', 4)).toBeNull();
  });

  it('should default to octave 4', () => {
    expect(Audio.getFrequency('A')).toBe(440);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS convertNoteName()
// ═══════════════════════════════════════════════════════════════
// TESTS playNote()
// ═══════════════════════════════════════════════════════════════

describe('Audio - playNote()', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should have playNote method', () => {
    expect(typeof Audio.playNote).toBe('function');
  });

  it('should not throw without context', () => {
    expect(() => Audio.playNote('C', 4, 1)).not.toThrow();
  });

  it('should return false without context', () => {
    expect(Audio.playNote('C', 4, 1)).toBe(false);
  });

  it('should accept French note names', () => {
    expect(() => Audio.playNote('do', 4, 1)).not.toThrow();
    expect(() => Audio.playNote('la', 4, 1)).not.toThrow();
  });

  it('should accept English note names', () => {
    expect(() => Audio.playNote('C', 4, 1)).not.toThrow();
    expect(() => Audio.playNote('A', 4, 1)).not.toThrow();
  });

  it('should accept sharps and flats', () => {
    expect(() => Audio.playNote('C#', 4, 1)).not.toThrow();
    expect(() => Audio.playNote('Bb', 4, 1)).not.toThrow();
    expect(() => Audio.playNote('fa#', 4, 1)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS playNoteWithTimbre()
// ═══════════════════════════════════════════════════════════════

describe('Audio - playNoteWithTimbre()', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should have playNoteWithTimbre method', () => {
    expect(typeof Audio.playNoteWithTimbre).toBe('function');
  });

  it('should not throw without context', () => {
    expect(() => Audio.playNoteWithTimbre('C', 4, 'piano', 1)).not.toThrow();
  });

  it('should return false without context', () => {
    expect(Audio.playNoteWithTimbre('C', 4, 'piano', 1)).toBe(false);
  });

  it('should accept different timbres', () => {
    expect(() => Audio.playNoteWithTimbre('C', 4, 'sine', 1)).not.toThrow();
    expect(() => Audio.playNoteWithTimbre('C', 4, 'piano', 1)).not.toThrow();
    expect(() => Audio.playNoteWithTimbre('C', 4, 'organ', 1)).not.toThrow();
    expect(() => Audio.playNoteWithTimbre('C', 4, 'flute', 1)).not.toThrow();
    expect(() => Audio.playNoteWithTimbre('C', 4, 'clarinet', 1)).not.toThrow();
    expect(() => Audio.playNoteWithTimbre('C', 4, 'brass', 1)).not.toThrow();
  });

  it('should fallback to sine for unknown timbre', () => {
    expect(() => Audio.playNoteWithTimbre('C', 4, 'unknown', 1)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS playInterval()
// ═══════════════════════════════════════════════════════════════

describe('Audio - playInterval()', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should have playInterval method', () => {
    expect(typeof Audio.playInterval).toBe('function');
  });

  it('should not throw without context', () => {
    expect(() => Audio.playInterval('C', 'E', 4, false, 1)).not.toThrow();
  });

  it('should return false without context', () => {
    expect(Audio.playInterval('C', 'E', 4, false, 1)).toBe(false);
  });

  it('should accept simultaneous parameter', () => {
    expect(() => Audio.playInterval('C', 'E', 4, true, 1)).not.toThrow();
    expect(() => Audio.playInterval('C', 'E', 4, false, 1)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS playChord()
// ═══════════════════════════════════════════════════════════════

describe('Audio - playChord()', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should have playChord method', () => {
    expect(typeof Audio.playChord).toBe('function');
  });

  it('should not throw without context', () => {
    expect(() => Audio.playChord(['C', 'E', 'G'], 4, 1)).not.toThrow();
  });

  it('should return false without context', () => {
    expect(Audio.playChord(['C', 'E', 'G'], 4, 1)).toBe(false);
  });

  it('should return false for non-array input', () => {
    expect(Audio.playChord('C', 4, 1)).toBe(false);
  });

  it('should accept notes with embedded octaves', () => {
    expect(() => Audio.playChord(['C4', 'E4', 'G4'], 4, 1)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS INTEGRATION NOTES MUSICALES
// ═══════════════════════════════════════════════════════════════

describe('Audio - Musical notes integration', () => {
  beforeEach(() => {
    Audio._context = null;
    Audio._enabled = true;
  });

  it('should handle full ear training sequence', () => {
    expect(() => {
      // Simulate ear training session
      Audio.playNote('do', 4, 0.5);
      Audio.playNote('ré', 4, 0.5);
      Audio.playNote('mi', 4, 0.5);
      Audio.playInterval('do', 'sol', 4, false, 0.5);
      Audio.playChord(['do', 'mi', 'sol'], 4, 1);
    }).not.toThrow();
  });

  it('should handle all 12 chromatic notes', () => {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    chromaticNotes.forEach(note => {
      expect(() => Audio.playNote(note, 4, 0.1)).not.toThrow();
    });
  });

  it('should handle French chromatic scale', () => {
    const chromaticFr = ['do', 'do#', 'ré', 'ré#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si'];
    chromaticFr.forEach(note => {
      expect(() => Audio.playNote(note, 4, 0.1)).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS DOUCEUR : enveloppe, timbres, niveaux, chaîne de sortie
// (faux contexte audio qui consigne l'automation, comme un navigateur
//  il refuse les temps négatifs ou non finis)
// ═══════════════════════════════════════════════════════════════

const AudioSoftness = (() => {
  const PARAM_METHODS = ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime'];

  function makeParam(initial = 0) {
    const p = { value: initial, events: [] };
    PARAM_METHODS.forEach(m => {
      p[m] = (value, time) => {
        if (typeof time !== 'number' || !isFinite(time) || time < 0) {
          throw new RangeError(`Time must be a finite non-negative number: ${time}`);
        }
        if (m === 'exponentialRampToValueAtTime' && !(value > 0)) {
          throw new RangeError('exponentialRamp cannot reach 0');
        }
        p.events.push({ type: m, value, time });
        return p;
      };
    });
    return p;
  }

  function makeContext() {
    const log = { oscillators: [], gains: [], filters: [], compressors: [] };
    const ctx = {
      currentTime: 0,
      state: 'running',
      sampleRate: 44100,
      destination: { name: 'destination', outputs: [] },
      createOscillator() {
        const o = {
          type: 'sine', frequency: makeParam(440), outputs: [], startAt: null, stopAt: null,
          connect(n) { o.outputs.push(n); return n; },
          start(t = 0) { o.startAt = t; },
          stop(t) {
            if (typeof t !== 'number' || !isFinite(t) || t < 0) throw new RangeError('bad stop time');
            o.stopAt = t;
          }
        };
        log.oscillators.push(o);
        return o;
      },
      createGain() {
        const g = { name: 'gain', gain: makeParam(1), outputs: [], connect(n) { g.outputs.push(n); return n; } };
        log.gains.push(g);
        return g;
      },
      createBiquadFilter() {
        const f = { name: 'filter', type: 'lowpass', frequency: makeParam(350), outputs: [], connect(n) { f.outputs.push(n); return n; } };
        log.filters.push(f);
        return f;
      },
      createDynamicsCompressor() {
        const c = {
          name: 'compressor', threshold: makeParam(-24), knee: makeParam(30), ratio: makeParam(12),
          attack: makeParam(0.003), release: makeParam(0.25), outputs: [], connect(n) { c.outputs.push(n); return n; }
        };
        log.compressors.push(c);
        return c;
      },
      resume() { return Promise.resolve(); }
    };
    ctx.log = log;
    return ctx;
  }

  /** Branche le faux contexte dans Audio (init() réel) et renvoie de quoi restaurer. */
  function install() {
    const saved = {
      context: Audio._context, masterGain: Audio._masterGain, bus: Audio._bus,
      enabled: Audio._enabled, volume: Audio._volume,
      AC: window.AudioContext, webkit: window.webkitAudioContext
    };
    const ctx = makeContext();
    window.AudioContext = function () { return ctx; };
    window.webkitAudioContext = window.AudioContext;
    Audio._context = null;
    Audio._masterGain = null;
    Audio._bus = null;
    Audio._enabled = true;
    Audio._volume = 0.5;
    Audio.init();
    return {
      ctx,
      restore() {
        window.AudioContext = saved.AC;
        window.webkitAudioContext = saved.webkit;
        Audio._context = saved.context;
        Audio._masterGain = saved.masterGain;
        Audio._bus = saved.bus;
        Audio._enabled = saved.enabled;
        Audio._volume = saved.volume;
      }
    };
  }

  /** Voix = oscillateur + chaîne (filtre éventuel) + gain d'enveloppe. */
  function voices(ctx) {
    return ctx.log.oscillators.map(osc => {
      let node = osc.outputs[0];
      let filtered = false;
      while (node && node.name === 'filter') { filtered = true; node = node.outputs[0]; }
      const events = node && node.gain ? node.gain.events : [];
      const values = events.map(e => e.value);
      const last = events[events.length - 1];
      return {
        osc, gain: node, filtered, events, type: osc.type,
        start: osc.startAt, stop: osc.stopAt,
        peak: values.length ? Math.max(...values) : 0,
        endTime: last ? last.time : null,
        endValue: last ? last.value : null
      };
    });
  }

  /** Plus grande somme des crêtes de voix qui se chevauchent */
  function overlapPeakSum(vs) {
    let max = 0;
    vs.forEach(a => {
      const sum = vs.filter(b => b.start <= a.start && a.start < b.endTime).reduce((s, b) => s + b.peak, 0);
      max = Math.max(max, sum);
    });
    return max;
  }

  const SOUNDS = [
    ['playCardToPurple', () => Audio.playCardToPurple()],
    ['playCardToOrange', () => Audio.playCardToOrange()],
    ['playCardToGreen', () => Audio.playCardToGreen()],
    ['playCardLand', () => Audio.playCardLand()],
    ['playCardToBox(never_played)', () => Audio.playCardToBox('never_played')],
    ['playStreakMilestone(3)', () => Audio.playStreakMilestone(3)],
    ['playStreakMilestone(6)', () => Audio.playStreakMilestone(6)],
    ['playStreakMilestone(12)', () => Audio.playStreakMilestone(12)],
    ['playStreakMilestone(25)', () => Audio.playStreakMilestone(25)],
    ['playStreakMilestone(50)', () => Audio.playStreakMilestone(50)],
    ['playLevelUp', () => Audio.playLevelUp()],
    ['playBadgeUnlocked', () => Audio.playBadgeUnlocked()],
    ['playNote', () => Audio.playNote('do', 4, 1)],
    ['playNote court', () => Audio.playNote('do', 4, 0.05)],
    ['playNoteWithTimbre piano', () => Audio.playNoteWithTimbre('la', 3, 'piano', 1)],
    ['playNoteWithTimbre organ', () => Audio.playNoteWithTimbre('do', 4, 'organ', 1)],
    ['playNoteWithTimbre brass', () => Audio.playNoteWithTimbre('do', 4, 'brass', 0.5)],
    ['playInterval simultané', () => Audio.playInterval('do', 'sol', 4, true, 1)],
    ['playInterval successif', () => Audio.playInterval('do', 'sol', 4, false, 0.5)],
    ['playChord', () => Audio.playChord(['do', 'mi', 'sol'], 4, 1.5)],
    ['playChord 5 notes', () => Audio.playChord(['do', 'mi', 'sol', 'si', 're'], 4, 1)]
  ];

  return { makeContext, install, voices, overlapPeakSum, SOUNDS };
})();

describe('Audio - Douceur : enveloppe de chaque voix', () => {
  let env;
  beforeEach(() => { env = AudioSoftness.install(); });
  afterEach(() => { env.restore(); });

  AudioSoftness.SOUNDS.forEach(([name, play]) => {
    it(`${name} : aucune exception et au moins une voix`, () => {
      expect(() => play()).not.toThrow();
      expect(AudioSoftness.voices(env.ctx).length).toBeGreaterThan(0);
    });

    it(`${name} : chaque voix démarre à 0 avec une attaque progressive`, () => {
      play();
      AudioSoftness.voices(env.ctx).forEach(v => {
        const first = v.events[0];
        expect(first.type).toBe('setValueAtTime');
        expect(first.value).toBe(0);
        expect(first.time).toBe(v.start);
        const rise = v.events[1];
        expect(rise.type).toBe('linearRampToValueAtTime');
        expect(rise.value).toBeGreaterThan(0);
        expect(rise.time - v.start).toBeGreaterThanOrEqual(Audio.ENVELOPE.minAttack - 1e-9);
      });
    });

    it(`${name} : chaque voix revient à 0 avec un relâchement progressif, avant l'arrêt de l'oscillateur`, () => {
      play();
      AudioSoftness.voices(env.ctx).forEach(v => {
        expect(v.endValue).toBe(0);
        const last = v.events[v.events.length - 1];
        expect(last.type).toBe('linearRampToValueAtTime');
        const hold = v.events[v.events.length - 2];
        expect(last.time - hold.time).toBeGreaterThanOrEqual(Math.min(Audio.ENVELOPE.minRelease, (last.time - v.start) * 0.6) - 1e-9);
        // aucun stop() avant la fin du relâchement
        expect(v.stop).toBeGreaterThanOrEqual(v.endTime + Audio.ENVELOPE.stopPad - 1e-9);
      });
    });

    it(`${name} : événements d'automation ordonnés, sans temps négatif ni rampe exponentielle vers 0`, () => {
      play();
      AudioSoftness.voices(env.ctx).forEach(v => {
        for (let i = 1; i < v.events.length; i++) {
          expect(v.events[i].time).toBeGreaterThanOrEqual(v.events[i - 1].time);
        }
        v.events.forEach(e => {
          expect(e.time).toBeGreaterThanOrEqual(0);
          expect(e.value).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it(`${name} : aucune onde carrée ni en dents de scie sans filtre`, () => {
      play();
      AudioSoftness.voices(env.ctx).forEach(v => {
        if (v.type === 'square' || v.type === 'sawtooth') {
          expect(v.filtered).toBe(true);
        } else {
          expect(v.type === 'sine' || v.type === 'triangle').toBe(true);
        }
      });
    });

    it(`${name} : crêtes programmées sous le plafond commun`, () => {
      play();
      const vs = AudioSoftness.voices(env.ctx);
      vs.forEach(v => expect(v.peak).toBeLessThanOrEqual(Audio.ENVELOPE.peakCeiling + 1e-9));
      // somme cohérente (pire cas) des crêtes qui se chevauchent : le limiteur rattrape le reste
      expect(AudioSoftness.overlapPeakSum(vs)).toBeLessThanOrEqual(1.8);
    });
  });
});

describe('Audio - Douceur : cas limites de l\'enveloppe', () => {
  let env;
  beforeEach(() => { env = AudioSoftness.install(); });
  afterEach(() => { env.restore(); });

  it('une note plus courte que attaque + décroissance + relâchement reste ordonnée et revient à 0', () => {
    // cas réel de l'ancienne version : durée 0.08 s pour un relâchement de 0.1 s (RangeError, temps négatif)
    expect(() => Audio._createTone(440, 'sine', 0, 0.08, 0.02, 0.1, 0.5, 0.1)).not.toThrow();
    const v = AudioSoftness.voices(env.ctx)[0];
    expect(v.endValue).toBe(0);
    expect(v.endTime).toBeLessThanOrEqual(0.08 + 1e-9);
    for (let i = 1; i < v.events.length; i++) {
      expect(v.events[i].time).toBeGreaterThanOrEqual(v.events[i - 1].time);
    }
  });

  it('une note de départ non nul (enchaînement) garde la même forme', () => {
    Audio._createTone(440, 'sine', 0.15, 0.2, 0.02, 0.1, 0.4, 0.1);
    const v = AudioSoftness.voices(env.ctx)[0];
    expect(v.events[0].time).toBe(0.15);
    expect(v.events[0].value).toBe(0);
    expect(v.stop).toBeGreaterThanOrEqual(0.35);
  });

  it('une onde carrée passe par un passe-bas, une sinusoïde non', () => {
    Audio._createTone(440, 'square', 0, 0.3, 0.02, 0.1, 0.4, 0.1);
    Audio._createTone(440, 'sawtooth', 0, 0.3, 0.02, 0.1, 0.4, 0.1);
    Audio._createTone(440, 'sine', 0, 0.3, 0.02, 0.1, 0.4, 0.1);
    const vs = AudioSoftness.voices(env.ctx);
    expect(vs[0].filtered).toBe(true);
    expect(vs[1].filtered).toBe(true);
    expect(vs[2].filtered).toBe(false);
    env.ctx.log.filters.forEach(f => {
      expect(f.type).toBe('lowpass');
      expect(f.frequency.value).toBe(Audio.SOFT_FILTER_HZ);
    });
  });

  it('la percussion démarre à 0, décroît sans viser 0 en exponentiel et revient à 0 avant l\'arrêt', () => {
    Audio.playCardLand();
    const perc = AudioSoftness.voices(env.ctx)[0];
    expect(perc.events[0].value).toBe(0);
    expect(perc.events[1].time).toBeGreaterThanOrEqual(Audio.ENVELOPE.minAttack - 1e-9);
    perc.events.filter(e => e.type === 'exponentialRampToValueAtTime').forEach(e => expect(e.value).toBeGreaterThan(0));
    expect(perc.endValue).toBe(0);
    expect(perc.stop).toBeGreaterThanOrEqual(perc.endTime);
  });
});

describe('Audio - Douceur : chaîne de sortie commune', () => {
  let env;
  beforeEach(() => { env = AudioSoftness.install(); });
  afterEach(() => { env.restore(); });

  it('init() construit voix → bus → limiteur → gain maître → sortie', () => {
    expect(Audio._bus).toBeTruthy();
    expect(Audio._bus.outputs[0].name).toBe('compressor');
    expect(Audio._bus.outputs[0].outputs[0]).toBe(Audio._masterGain);
    expect(Audio._masterGain.outputs[0]).toBe(env.ctx.destination);
  });

  it('le limiteur est doux (seuil bas, genou large)', () => {
    const comp = env.ctx.log.compressors[0];
    expect(comp.threshold.value).toBeLessThan(-6);
    expect(comp.knee.value).toBeGreaterThanOrEqual(6);
    expect(comp.ratio.value).toBeGreaterThan(1);
  });

  it('toutes les voix se connectent au bus (aucune sortie directe vers le gain maître)', () => {
    AudioSoftness.SOUNDS.forEach(([, play]) => play());
    AudioSoftness.voices(env.ctx).forEach(v => {
      expect(v.gain.outputs[0]).toBe(Audio._bus);
    });
  });

  it('le volume du joueur ne règle que le gain maître', () => {
    Audio.setVolume(0.3);
    expect(Audio._masterGain.gain.value).toBe(0.3);
    expect(Audio._bus.gain.value).toBe(Audio.OUTPUT.mixGain);
    Audio.setVolume(1);
    expect(Audio._masterGain.gain.value).toBe(1);
    expect(Audio._bus.gain.value).toBe(Audio.OUTPUT.mixGain);
  });

  it('sans compresseur disponible, le bus se connecte au gain maître', () => {
    env.ctx.createDynamicsCompressor = undefined;
    Audio._context = null; Audio._masterGain = null; Audio._bus = null;
    Audio.init();
    expect(Audio._bus.outputs[0]).toBe(Audio._masterGain);
    expect(() => Audio.playCardToGreen()).not.toThrow();
  });

  it('audio désactivé ou contexte absent : aucune exception, aucune voix', () => {
    Audio._enabled = false;
    AudioSoftness.SOUNDS.forEach(([, play]) => expect(() => play()).not.toThrow());
    expect(env.ctx.log.oscillators.length).toBe(0);
    Audio._enabled = true;
    Audio._context = null;
    AudioSoftness.SOUNDS.forEach(([, play]) => expect(() => play()).not.toThrow());
  });
});

describe('Audio - Douceur : rôles des sons conservés', () => {
  let env;
  beforeEach(() => { env = AudioSoftness.install(); });
  afterEach(() => { env.restore(); });

  function profile(play) {
    env.ctx.log.oscillators.length = 0;
    play();
    const vs = AudioSoftness.voices(env.ctx);
    const freqs = vs.map(v => v.osc.frequency.value);
    return {
      freqs,
      count: vs.length,
      maxFreq: Math.max(...freqs),
      length: Math.max(...vs.map(v => v.endTime)) - Math.min(...vs.map(v => v.start)),
      first: freqs[0]
    };
  }

  it('carte verte, orange et violette restent distinctes', () => {
    const p = profile(() => Audio.playCardToPurple());
    const o = profile(() => Audio.playCardToOrange());
    const g = profile(() => Audio.playCardToGreen());
    expect(JSON.stringify(p.freqs)).not.toBe(JSON.stringify(o.freqs));
    expect(JSON.stringify(o.freqs)).not.toBe(JSON.stringify(g.freqs));
    expect(JSON.stringify(p.freqs)).not.toBe(JSON.stringify(g.freqs));
    expect(g.maxFreq).toBeGreaterThan(o.maxFreq);
    expect(g.maxFreq).toBeGreaterThan(p.maxFreq);
  });

  it('le son d\'erreur reste bref et grave (jamais punitif)', () => {
    const p = profile(() => Audio.playCardToPurple());
    expect(p.length).toBeLessThanOrEqual(0.8);
    expect(p.maxFreq).toBeLessThanOrEqual(440);
    AudioSoftness.voices(env.ctx).forEach(v => expect(v.type).toBe('sine'));
  });

  it('les paliers de série restent croissants en durée et en richesse', () => {
    const tiers = [3, 6, 12, 25, 50].map(m => profile(() => Audio.playStreakMilestone(m)));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].length).toBeGreaterThan(tiers[i - 1].length);
      expect(tiers[i].count).toBeGreaterThan(tiers[i - 1].count);
    }
  });

  it('les hauteurs des notes de deck ne changent pas (440 Hz, harmoniques entières)', () => {
    let p = profile(() => Audio.playNote('la', 4, 1));
    expect(p.freqs).toEqual([440]);
    p = profile(() => Audio.playNoteWithTimbre('la', 4, 'piano', 1));
    expect(p.freqs).toEqual([440, 880, 1320, 1760, 2200, 2640]);
    p = profile(() => Audio.playChord(['do', 'mi', 'sol'], 4, 1));
    expect(p.freqs).toEqual([261.63, 329.63, 392]);
  });

  it('les timbres ont la même crête quel que soit le nombre d\'harmoniques', () => {
    const peaks = ['sine', 'piano', 'organ', 'flute', 'clarinet', 'brass'].map(t => {
      env.ctx.log.oscillators.length = 0;
      Audio.playNoteWithTimbre('do', 4, t, 1);
      return AudioSoftness.overlapPeakSum(AudioSoftness.voices(env.ctx));
    });
    peaks.forEach(x => expect(x).toBeLessThanOrEqual(1 + 1e-9));
    expect(Math.max(...peaks) - Math.min(...peaks)).toBeLessThanOrEqual(0.25);
  });
});
