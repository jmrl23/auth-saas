declare module 'random-string' {
  export default function randomString(options: Partial<Options>): string {}

  interface Options {
    length: number;
    numeric: boolean;
    letters: boolean;
    special: boolean;
    exclude: string[];
  }
}
