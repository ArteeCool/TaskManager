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
    board_id INT REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    list_id INT REFERENCES lists(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_invitations (
  id SERIAL PRIMARY KEY,
  board_id INT NOT NULL,
  inviter_id INT NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT now() + interval '7 days'
);

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);
