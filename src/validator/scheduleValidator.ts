import { z } from "zod";

export const scheduleValidator = z.object({
  fileId: z.string(),
  ScheduleName: z.string(),
  serverIp: z.string(),
  time: z.string(),
});
export type TScheduleValidtor = z.infer<typeof scheduleValidator>;

export const ScheduleCancleValidator = z.object({
  scheduleId: z.string(),
});
export type TScheduleCancleValidator = z.infer<typeof ScheduleCancleValidator>;
