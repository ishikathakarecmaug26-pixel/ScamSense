import "dotenv/config";
import { env } from "./config/env.js";
import app from "./app.js";

app.listen(env.PORT, ()=>{
    console.log(`ScamSense is running at http://localhost:${env.PORT}`);
});
