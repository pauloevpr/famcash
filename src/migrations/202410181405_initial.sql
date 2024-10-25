create table users (
		id serial primary key,
		email varchar(255) unique not null,
		name varchar(64) not null
);

create table login_token (
		token varchar(255) primary key,
		user_id integer not null references users(id) on delete cascade,
		expiration timestamptz not null,
		created_at timestamptz not null default NOW()
);

create table signup_token (
		token varchar(255) primary key,
		expiration timestamptz not null,
		created_at timestamptz not null default NOW(),
		email varchar(255) unique not null
);

create table profile (
	id serial primary key,
	created_by integer not null references users(id) on delete cascade,
	created_at timestamptz not null default NOW()
);

create table membership (
	user_id integer not null references users(id) on delete cascade,
	profile_id integer not null references profile(id) on delete cascade,
	invited_by integer not null references users(id) on delete cascade,
	admin boolean not null,
	primary key (user_id, profile_id)
);

create table invite (
	id serial primary key,
	created_by integer not null references users(id) on delete cascade,
	created_at timestamptz not null default NOW(),
	expired_at timestamptz not null default NOW(),
	email varchar(255) not null,
	accepted boolean not null
);

create table records (
	id varchar(20) not null,
	type varchar(32) not null,
	profile integer not null references profile(id) on delete cascade,
	created_by integer not null references users(id),
	created_at timestamptz not null,
	updated_at timestamptz not null,
	updated_by integer not null references users(id),
	deleted boolean not null,
	data jsonb,
	primary key (id, type, profile)
);































