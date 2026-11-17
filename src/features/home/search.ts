import { z } from 'zod'
// Tudo opcional na saída: o restante do app faz navigate({ search: (p) => ({ ...p, page }) }) sem precisar de defaults.
export const homeSearch = z.object({
  q: z.string().optional().catch(undefined),
  category: z.array(z.string()).optional().catch(undefined).transform((v) => (v?.length ? v : undefined)),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional().catch(undefined),
  tab: z.enum(['all', 'new', 'hot']).optional().catch(undefined),
  min: z.string().regex(/^\d+(\.\d+)?$/).optional().catch(undefined),
  max: z.string().regex(/^\d+(\.\d+)?$/).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})
export type HomeSearch = z.infer<typeof homeSearch>
