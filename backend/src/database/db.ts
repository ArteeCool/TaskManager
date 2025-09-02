import pg from "pg";

let client: pg.Pool | null = null;

export const dbInit = async () => {
    const dbConnectionData = {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    };

    client = new pg.Pool(dbConnectionData);
};

export const connectDB = async () => {
    if (client) {
        try {
            await client.connect();
            console.log("Database connected");
        } catch (error) {
            console.log(error);
        }
    }
};

export const disconnectDB = async () => {
    if (client) {
        try {
            await client.end();
            console.log("Database disconnected");
        } catch (error) {
            console.log(error);
        }
    }
};

export const queryDB = async (query: string, values?: any) => {
    if (client) {
        return client.query(query, values);
    }
};
