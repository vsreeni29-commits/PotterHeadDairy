import { z } from "zod";
const modes = ["Diary","Vent","Quick","Roll Call","Council","Judge","Script","Debrief","Unsent"] as const;
const sealed=z.object({v:z.literal(1),iv:z.string().regex(/^[A-Za-z0-9+/]{16}$/),data:z.string().min(24).max(180000).regex(/^[A-Za-z0-9+/]+={0,2}$/)}).strict();
const profile=z.object({name:z.string().trim().min(1).max(40),potter:z.boolean(),language:z.enum(["English","Tanglish"]).default("English")});
const entry=z.object({text:z.string().max(18000),mode:z.enum(modes),report:z.string().max(60000).nullable().default(null)});
export const DiaryModel={modes,sealed,profile,entry};
