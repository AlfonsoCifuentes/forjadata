import { z } from 'zod'

export const promptVersions = {
  materialExtraction: 'material-extraction@1.0.0',
  categoryClassification: 'category-classification@1.0.0',
  duplicateExplanation: 'duplicate-explanation@1.0.0',
} as const

export const MaterialExtractionResultSchema = z.object({
  shortDescription: z.string().min(1).max(120),
  category: z.string().min(1),
  attributes: z.array(
    z.object({
      code: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      unit: z.string().nullable(),
      confidence: z.number().min(0).max(1),
      evidence: z.object({
        text: z.string().min(1),
        page: z.number().int().positive(),
      }),
    }),
  ),
  warnings: z.array(z.string()),
})

export type MaterialExtractionResult = z.infer<typeof MaterialExtractionResultSchema>

export function materialExtractionSystemPrompt(): string {
  return [
    'Extrae datos de materiales industriales sin inventar valores.',
    'Devuelve solo JSON que cumpla el esquema proporcionado.',
    'Cada valor debe incluir evidencia verificable y confianza entre 0 y 1.',
    'Cuando falte un dato, usa null y añade una advertencia.',
  ].join(' ')
}
