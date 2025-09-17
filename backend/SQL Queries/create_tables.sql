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
	title TEXT NOT NULL,
    description TEXT NOT NULL,
    color_background TEXT NOT NULL,
    color_accent TEXT NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS board_users (
    user_id INT NOT NULL,
    board_id INT NOT NULL,
    role TEXT NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, board_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    board_id INT NOT NULL REFERENCES boards(id) oN DELETE CASCADE,
    title INT NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'none',
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'none',
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
