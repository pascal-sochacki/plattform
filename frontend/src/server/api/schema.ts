import { z } from "zod";
export const CreateProjectSchema = z.object({ project: z.string() });
