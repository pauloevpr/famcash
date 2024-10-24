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

create table records (
	id varchar(20) not null,
	type varchar(32) not null,
	user_id varchar(255) not null references users(id) on delete cascade,
	created_at timestamptz not null,
	updated_at timestamptz not null,
	deleted boolean not null,
	data jsonb,
	primary key (id, type, user_id)
);

