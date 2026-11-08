import mysql from  "mysql2/promise";
import { env } from "./env.js";

const pool = mysql.createPool({
    host: env.DB_HOST,//db server at 127.0.0.1
    port: env.DB_PORT,//3306
    user: env.DB_USER,//root
    password: env.DB_PASSWORD,//mera pwd
    database: env.DB_NAME,//scamsense
    waitForConnections: true,//if all busy then this makes us wait isntead of fail
    connectionLimit: 10,//10 simultaneous connections
    queueLimit: 0,//no limits in queue
});

export default pool;