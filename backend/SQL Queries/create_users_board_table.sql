CREATE TABLE board_users (
    board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    PRIMARY KEY (board_id, user_id)
);
