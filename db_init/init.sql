CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY NOT NULL,
    fullname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatarurl TEXT NOT NULL,
    roles TEXT[] NOT NULL,
    confirmation_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
)