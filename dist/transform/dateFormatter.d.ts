export declare enum DatePreset {
    /** example: 2005-08-15T15:52:01+0000 */
    ISO8601 = "iso8601",
    /** example: Mon, 15 Aug 05 15:52:01 +0000*/
    RFC822 = "rfc822",
    /** example: Monday, 15-Aug-05 15:52:01 UTC */
    RFC850 = "rfc850",
    /** example: Mon, 15 Aug 05 15:52:01 +0000 */
    RFC1036 = "rfc1036",
    /** example: Mon, 15 Aug 2005 15:52:01 +0000 */
    RFC1123 = "rfc1123",
    /** example: Sat, 30 Apr 2016 17:52:13 GMT */
    RFC7231 = "rfc7231",
    /** example: Mon, 15 Aug 2005 15:52:01 +0000 */
    RFC2822 = "rfc2822",
    /** example: 2005-08-15T15:52:01+00:00 */
    W3C = "w3c"
}
export declare class DateFormatter {
    static validateFormat(value: string, format: string): boolean;
    static dateFormatToRegex(format: string, { anchors, allowUppercaseMD, }?: {
        anchors?: boolean | undefined;
        allowUppercaseMD?: boolean | undefined;
    }): RegExp;
    static format(value: any, format: string): string;
    static formatWithPhpStyle(date: Date, format: string): string;
}
//# sourceMappingURL=dateFormatter.d.ts.map