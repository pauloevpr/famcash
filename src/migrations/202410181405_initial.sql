create table users (
		id varchar(255) primary key,
		name varchar(64) not null
);

create table user_token (
		token varchar(255) primary key,
		user_id varchar(255) not null references users(id) on delete cascade,
		expiration timestamptz not null,
		created_at timestamptz not null default NOW()
);

