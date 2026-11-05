import {z} from "zod";//Satyam: zod validation lib so how valid config is we will know 

// Satyam: config defination for environment, basically we tell zod the bkend need these objs and fields

const envSchema = z.object({
    NODE_ENV: z.enum(["development","test","production"]).default("development"),
    PORT:z.coerce.number().int().positive().default(5000),
    DB_HOST:z.string().min(1).default("127.0.0.1"),
    DB_PORT:z.coerce.number().int().positive().default(3306),
    DB_USER:z.string().min(1).default("root"),
    DB_PASSWORD:z.string().default(""),
    DB_NAME:z.string().min(1).default("scamsense_db"),

    SESSION_SECRET:z.string().min(32,"SESSION_SECRET must contain at least 32 chars"),
    //satyam: these are optional cuz exteranl servce so loose coupling
    NVIDIA_API_KEY:z.string().optional().transform((value)=>value?.trim() || undefined),

    NVIDIA_MODEL:z.string().optional().transform((value)=>value?.trim() || undefined),
});

// Satyam: validation of envs

const parsedEnv = envSchema.safeParse(process.env);

// Satyam:stop server if config is invalid this is type narrowing so we can access .error and zod is providing issues array

if(!parsedEnv.success){
    const errorMessages = parsedEnv.error.issues.map((issue)=>{
        const field = issue.path.join(".");
        return `${field}: ${issue.message}`;
    });

    throw new Error(`Invalid env config: ${errorMessages.join("\n")}`);
}

//satyam: exporting the valid config for whole backend

export const env = parsedEnv.data;