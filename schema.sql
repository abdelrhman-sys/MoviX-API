CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name varchar(30) NOT NULL,
    sec_name varchar(30) NOT NULL,
    profile_pic TEXT
);

CREATE TABLE fav_shows (
    user_id INTEGER REFERENCES users(user_id), 
    show_id INTEGER NOT NULL,
    show_type varchar(8) NOT NULL,
    show_poster TEXT NOT NULL,
    show_name TEXT NOT NULL,
    UNIQUE (user_id, show_id, show_type)
);

CREATE TABLE later_shows (
    user_id INTEGER REFERENCES users(user_id),
    show_id INTEGER NOT NULL,
    show_type varchar(8) NOT NULL,
    show_poster TEXT NOT NULL,
    show_name TEXT NOT NULL,
    UNIQUE (user_id, show_id, show_type)
);
