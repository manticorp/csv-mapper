export enum DatePreset {
    /** example: 2005-08-15T15:52:01+0000 */
    ISO8601 = 'iso8601',
    /** example: Mon, 15 Aug 05 15:52:01 +0000*/
    RFC822 = 'rfc822',
    /** example: Monday, 15-Aug-05 15:52:01 UTC */
    RFC850 = 'rfc850',
    /** example: Mon, 15 Aug 05 15:52:01 +0000 */
    RFC1036 = 'rfc1036',
    /** example: Mon, 15 Aug 2005 15:52:01 +0000 */
    RFC1123 = 'rfc1123',
    /** example: Sat, 30 Apr 2016 17:52:13 GMT */
    RFC7231 = 'rfc7231',
    /** example: Mon, 15 Aug 2005 15:52:01 +0000 */
    RFC2822 = 'rfc2822',
    /** example: 2005-08-15T15:52:01+00:00 */
    W3C = 'w3c',
}

export class DateFormatter {
    static validateFormat(value: string, format: string): boolean {
        const regex = DateFormatter.dateFormatToRegex(format);
        return regex.test(String(value));
    }
    static dateFormatToRegex(format:string, {
        anchors = true,
        allowUppercaseMD = true,
    } = {}): RegExp {
        const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        switch (format.toLowerCase()) {
        case DatePreset.ISO8601:
            return /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

        case DatePreset.RFC822:
            return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d{2}|\d{4})\s(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;

        case DatePreset.RFC850:
            return /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s(0[1-9]|[12]\d|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;

        case DatePreset.RFC1036:
            return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|[PMCE][SD]T|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;

        case DatePreset.RFC1123:
            // 4-digit year; allows GMT/UT or numeric offset
            return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|UT|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;

        case DatePreset.RFC7231:
            // IMF-fixdate (HTTP-date) — must be GMT
            return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;

        case DatePreset.RFC2822:
            // Optional weekday; 4-digit year; seconds optional; numeric offset or common (obs-zone) names
            return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(0?[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;

        case DatePreset.W3C:
            // W3C-DTF (subset of ISO 8601): strict 'T', optional fractional seconds, 'Z' or ±HH:MM
            return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
        }


        const map : Record<string,string> = {
        // Years
        'X': '[-+]\\d{4}\\d*', // at least 4-digit year with - for BCE and + for CE, e.g. +0012, -1234, +1066, +2025
        'Y': '-?\\d{4}\\d*',   // at least 4-digit year, e.g. 0012, -1234, 1066, 2025
        'y': '-?\\d+',

        // Months
        'F': '(?:(?i)January|February|March|April|May|June|July|August|September|October|November|December)',
        'M': '(?:(?i)Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',
        'm': '(?:0[1-9]|1[0-2])',        // 01-12
        'n': '(?:[1-9]|1[0-2])',         // 1-12 (no leading 0)

        // Days
        'l': '(?:(?i)Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)',
        'D': '(?:(?i)Mon|Tue|Wed|Thu|Fri|Sat|Sun)',
        'd': '(?:0[1-9]|[12]\\d|3[01])', // 01-31
        'j': '(?:[1-9]|[12]\\d|3[01])',  // 1-31 (no leading 0)
        'S': '(?:(?i)st|nd|rd|th)',      // 1st, 2nd, 3rd, 4th, etc.

        // Hours / minutes / seconds
        'a': '(am|pm)',
        'A': '(AM|PM)',
        'h': '(?:[0][0-9]|1[0-2])',      // 00-12
        'H': '(?:[01]\\d|2[0-3])',       // 00-23
        'g': '(?:\\d|1[0-2])',           // 0-12
        'G': '(?:\\d|1\\d|2[0-3])',      // 0-23
        'i': '[0-5]\\d',                 // 00-59
        's': '[0-5]\\d',                 // 00-59

        // Misc handy ones if you need them later:
        'U': '\\d+',                     // seconds since Unix epoch
        };

        if (allowUppercaseMD) {
        map['M'] = map['m'];
        map['D'] = map['d'];
        }

        let out = '';
        for (let i = 0; i < format.length; i++) {
        const ch = format[i];

        // Backslash escapes the next character (PHP-style)
        if (ch === '\\') {
            i++;
            if (i < format.length) out += esc(format[i]);
            continue;
        }

        out += map[ch] || esc(ch);
        }

        return new RegExp((anchors ? '^' : '') + out + (anchors ? '$' : ''));
    }

    static format(value: any, format: string): string {
        if (!value) return '';

        let date: Date;
        if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value);
            if (isNaN(date.getTime())) {
                return `Invalid Date`;
            }
        }

        // Handle predefined format shortcuts
        switch (format.toLowerCase()) {
            case DatePreset.RFC822:
                return date.toUTCString().replace('GMT', '+0000');
            case DatePreset.RFC850:
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dayName = days[date.getUTCDay()];
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = months[date.getUTCMonth()];
                const year = String(date.getUTCFullYear()).slice(-2);
                const hours = String(date.getUTCHours()).padStart(2, '0');
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(date.getUTCSeconds()).padStart(2, '0');
                return `${dayName}, ${day}-${month}-${year} ${hours}:${minutes}:${seconds} GMT`;
            case DatePreset.RFC1036:
            case DatePreset.RFC1123:
            case DatePreset.RFC2822:
            case DatePreset.RFC7231:
                return date.toUTCString();
            case DatePreset.ISO8601:
            case DatePreset.W3C:
                return date.toISOString();
        }

        // Handle PHP-style format strings
        return DateFormatter.formatWithPhpStyle(date, format);
    }

    static formatWithPhpStyle(date: Date, format: string): string {
        const formatMap: Record<string, () => string> = {
            // Day
            'd': () => String(date.getDate()).padStart(2, '0'),           // 01-31
            'D': () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()], // Mon-Sun
            'j': () => String(date.getDate()),                           // 1-31
            'l': () => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()], // Sunday-Saturday
            'N': () => String(date.getDay() || 7),                       // 1-7 (Monday=1)
            'S': () => {
                const day = date.getDate();
                if (day >= 11 && day <= 13) return 'th';
                switch (day % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            },
            'w': () => String(date.getDay()),                            // 0-6 (Sunday=0)
            'z': () => {
                const start = new Date(date.getFullYear(), 0, 1);
                return String(Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
            },

            // Week
            'W': () => {
                const target = new Date(date.valueOf());
                const dayNumber = (date.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNumber + 3);
                const firstThursday = target.valueOf();
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
                }
                return String(1 + Math.ceil((firstThursday - target.valueOf()) / 604800000));
            },

            // Month
            'F': () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()],
            'm': () => String(date.getMonth() + 1).padStart(2, '0'),     // 01-12
            'M': () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
            'n': () => String(date.getMonth() + 1),                      // 1-12
            't': () => String(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()),

            // Year
            'L': () => {
                const year = date.getFullYear();
                return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? '1' : '0';
            },
            'o': () => {
                const target = new Date(date.valueOf());
                target.setDate(target.getDate() - ((date.getDay() + 6) % 7) + 3);
                return String(target.getFullYear());
            },
            'X': () => {
                const year = date.getFullYear();
                return (year >= 0 ? '+' : '') + String(year).padStart(4, '0');
            },
            'Y': () => String(date.getFullYear()),                       // 2025
            'y': () => String(date.getFullYear()).slice(-2),            // 25

            // Time
            'a': () => date.getHours() < 12 ? 'am' : 'pm',
            'A': () => date.getHours() < 12 ? 'AM' : 'PM',
            'B': () => {
                const hours = date.getUTCHours();
                const minutes = date.getUTCMinutes();
                const seconds = date.getUTCSeconds();
                const beats = Math.floor(((hours * 3600) + (minutes * 60) + seconds) / 86.4);
                return String(beats).padStart(3, '0');
            },
            'g': () => {
                const hour = date.getHours() % 12;
                return String(hour === 0 ? 12 : hour);                     // 1-12
            },
            'G': () => String(date.getHours()),                          // 0-23
            'h': () => {
                const hour = date.getHours() % 12;
                return String(hour === 0 ? 12 : hour).padStart(2, '0');   // 01-12
            },
            'H': () => String(date.getHours()).padStart(2, '0'),        // 00-23
            'i': () => String(date.getMinutes()).padStart(2, '0'),      // 00-59
            's': () => String(date.getSeconds()).padStart(2, '0'),      // 00-59
            'u': () => String(date.getMilliseconds() * 1000).padStart(6, '0'), // microseconds
            'v': () => String(date.getMilliseconds()).padStart(3, '0'), // milliseconds

            // Timezone
            'e': () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            'I': () => {
                const jan = new Date(date.getFullYear(), 0, 1);
                const jul = new Date(date.getFullYear(), 6, 1);
                return date.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset()) ? '1' : '0';
            },
            'O': () => {
                const offset = -date.getTimezoneOffset();
                const hours = Math.floor(Math.abs(offset) / 60);
                const minutes = Math.abs(offset) % 60;
                return (offset >= 0 ? '+' : '-') + String(hours).padStart(2, '0') + String(minutes).padStart(2, '0');
            },
            'P': () => {
                const offset = -date.getTimezoneOffset();
                const hours = Math.floor(Math.abs(offset) / 60);
                const minutes = Math.abs(offset) % 60;
                return (offset >= 0 ? '+' : '-') + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
            },
            'T': () => {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (timeZone) {
                    const formatter = new Intl.DateTimeFormat('en', { timeZoneName: 'short', timeZone });
                    const parts = formatter.formatToParts(date);
                    const tzPart = parts.find(part => part.type === 'timeZoneName');
                    return tzPart?.value || 'UTC';
                }
                return 'UTC';
            },
            'Z': () => String(date.getTimezoneOffset() * -60),

            // Full date/time
            'c': () => date.toISOString(),
            'r': () => date.toUTCString(),
            'U': () => String(Math.floor(date.getTime() / 1000))
        };

        let result = '';
        let i = 0;

        while (i < format.length) {
            const char = format[i];

            if (char === '\\') {
            // Escaped character
            i++;
            if (i < format.length) {
                result += format[i];
            }
            } else if (formatMap[char]) {
            result += formatMap[char]();
            } else {
            result += char;
            }

            i++;
        }

        return result;
    }
}