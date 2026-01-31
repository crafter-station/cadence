declare module "unidiff" {
  export function diffLines(oldText: string, newText: string): string[];
  export function formatLines(
    lines: string[],
    options?: { context?: number; aname?: string; bname?: string }
  ): string;
}
