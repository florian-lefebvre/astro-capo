import { sequence } from "astro/middleware";
import { withCapo } from "astro-capo";

export const onRequest = sequence(withCapo);
