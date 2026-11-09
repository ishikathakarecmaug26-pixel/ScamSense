import { z } from "zod"; //importing zod pckg
// creating object schema
const envSchema = z.object({
    // specifying environment where app is running in
    NODE_ENV: z.enum(["development","test","production"]).default("development"),
    // string->num->int->+ve->default
    PORT: z.coerce.number().int().positive().default(5000),
    // DB config
    DB_HOST:z.string().min(1).default("127.0.0.1"),
    DB_PORT:z.coerce.number().int().positive().default(3306),
    DB_USER:z.string().min(1).default("root"),
    DB_PASSWORD:z.string().default(""),
    DB_NAME:z.string().min(1).default("scamsense"),
    //jwt config
    JWT_SECRET:z.string().min(32,"JWT secret must be 32 chars long"),//added issue msg
    JWT_EXPIRES_IN:z.string().default("1d"),
    //goggle api key
    GOOGLE_SAFE_BROWSING_API_KEY:z.string().optional().default(""),
    //smtp config
    SMTP_HOST:z.string().optional().default(""),
    SMTP_PORT:z.coerce.number().int().positive().default(587),
    SMTP_SECURE:z.union([z.boolean(),z.string()]).optional().default(false).transform((val)=> val === true || val === "true" || val === "1"),
    SMTP_USER:z.string().optional().default(""),
    SMTP_PASS:z.string().optional().default(""),
    EMAIL_FROM:z.string().optional().default(""),
    //frontend cors
    CLIENT_URL:z.string().optional().default("http://localhost:5173"),
});

// validating envs against schema
const parsedEnv = envSchema.safeParse(process.env);//safe parse cuz zod throws error during parse() if validation fails where safeparse returns obj which tells validation is pass or fail

if(!parsedEnv.success){
    const errorMessage = parsedEnv.error.issues.map((issue)=>{
        const field = issue.path.join(".");
        return `${field}: ${issue.message}`;
    });

    throw new Error(
        `Invalid env config ${errorMessage.join("\n")}`
    );
}
//other modules can use this validated envs
export const env = parsedEnv.data;