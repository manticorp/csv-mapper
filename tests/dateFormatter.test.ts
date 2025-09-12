/**
 * Core CsvMapper functionality tests
 */

import { DateFormatter, DatePreset } from '../src/transform/dateFormatter';

describe('DateFormatter', () => {
    test('formatting date to different formats', () => {
        DateFormatter.format(new Date('2025-09-12T14:30:00+01:00'), 'Y-m-d');
        const date = new Date('2025-09-12T14:30:00+00:00');
        expect(DateFormatter.format(date, 'Y-m-d')).toBe('2025-09-12');
        expect(DateFormatter.format(date, 'd-m-Y')).toBe('12-09-2025');
        expect(DateFormatter.format(date, 'd/m/Y')).toBe('12/09/2025');
        expect(DateFormatter.format(date, 'd@m@Y')).toBe('12@09@2025');
        expect(DateFormatter.format(date, 'd\\dm\\mY\\Y')).toBe('12d09m2025Y');
        expect(DateFormatter.format(date, DatePreset.W3C)).toBe(date.toISOString());
        expect(DateFormatter.format(date, DatePreset.ISO8601)).toBe(date.toISOString());
        expect(DateFormatter.format(date, DatePreset.RFC822)).toBe(date.toUTCString().replace('GMT', '+0000'));
        expect(DateFormatter.format(date, DatePreset.RFC1036)).toBe(date.toUTCString());
        expect(DateFormatter.format(date, DatePreset.RFC1123)).toBe(date.toUTCString());
        expect(DateFormatter.format(date, DatePreset.RFC2822)).toBe(date.toUTCString());
        expect(DateFormatter.format(date, DatePreset.RFC7231)).toBe(date.toUTCString());
        expect(DateFormatter.format(date, 'w3c')).toBe(date.toISOString());
        expect(DateFormatter.format(date, 'iso8601')).toBe(date.toISOString());
        expect(DateFormatter.format(date, 'rfc822')).toBe(date.toUTCString().replace('GMT', '+0000'));
        expect(DateFormatter.format(date, 'rfc1036')).toBe(date.toUTCString());
        expect(DateFormatter.format(date, 'rfc1123')).toBe(date.toUTCString());
        expect(DateFormatter.format(date, 'rfc2822')).toBe(date.toUTCString());
        expect(DateFormatter.format(date, 'rfc7231')).toBe(date.toUTCString());
    });
});
