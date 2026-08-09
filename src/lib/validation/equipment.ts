import { z } from "zod";

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(2, "Equipment name is required").max(200),
  description: z.string().trim().max(1000).optional().default(""),
  type: z.string().trim().min(1, "Equipment type is required").max(100),
  quantityTotal: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  link: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateEquipmentSchema = z.object({
  name: z.string().trim().min(2, "Equipment name is required").max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  type: z.string().trim().min(1, "Equipment type is required").max(100).optional(),
  quantityTotal: z.coerce.number().int().min(1, "Must have at least 1 unit").optional(),
  link: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
