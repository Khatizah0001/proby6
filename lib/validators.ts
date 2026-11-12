import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'E-mel diperlukan').email('Format e-mel tidak sah'),
  password: z.string().min(8, 'Kata laluan sekurang-kurangnya 8 aksara'),
})
export type LoginInput = z.infer<typeof loginSchema>
