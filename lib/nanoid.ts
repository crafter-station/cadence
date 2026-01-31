import { nanoid as generateNanoid } from "nanoid";

export function nanoid(size?: number): string {
  return generateNanoid(size ?? 21);
}
