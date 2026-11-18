import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.email('E-mail inválido.'),
  password: z
    .string()
    .min(8, 'Use ao menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'Inclua uma letra.')
    .regex(/\d/, 'Inclua um número.'),
})
export type SignupValues = z.infer<typeof signupSchema>

export const authSearch = z.object({
  redirect: z.string().optional().catch(undefined),
})
export type AuthSearch = z.infer<typeof authSearch>
