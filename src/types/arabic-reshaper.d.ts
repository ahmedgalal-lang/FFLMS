declare module "arabic-reshaper" {
  /** Convert logical Arabic text into contextual presentation-form glyphs. */
  export function convertArabic(text: string): string;
  export function convertArabicBack(text: string): string;
  const _default: {
    convertArabic: typeof convertArabic;
    convertArabicBack: typeof convertArabicBack;
  };
  export default _default;
}
