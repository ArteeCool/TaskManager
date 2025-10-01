import pg from "pg";

let pool: pg.Pool;

export const dbInit = () => {
    const dbConnectionData = {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    };

    pool = new pg.Pool(dbConnectionData);

    pool.on("error", (err, client) => {
        console.error("Unexpected Postgres pool error:", err);
    });
};

export const queryDB = async (query: string, values?: any) => {
    if (!pool) throw new Error("Database pool not initialized");

    try {
        return await pool.query(query, values);
    } catch (err) {
        console.error("Query error:", err);
        throw err;
    }
};

export const disconnectDB = async () => {
    if (pool) {
        await pool.end();
        console.log("Database pool closed");
    }
};
