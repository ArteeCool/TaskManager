import pg from "pg";

let client: pg.Pool | null = null;

export const dbInit = async () => {
    const dbConnectionData = {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };

    client = new pg.Pool(dbConnectionData);
};

export const connectDB = async () => {
    if (client) {
        try {
            client.connect();
            console.log("Database connected");
        } catch (error) {
            console.log(error);
        }
    }
};

export const disconnectDB = async () => {
    if (client) {
        try {
            client.end();
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
