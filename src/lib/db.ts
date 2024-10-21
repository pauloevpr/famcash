import pg from "pg"
import { DbUserToken, DbUser } from "./models";
import { randomBytes } from "crypto";

const { Pool } = pg
const conn = new Pool({
	connectionString: process.env.DB_CONNECTION,
});

export const db = {
	user: {
		async create(email: string, nickname: string) {
			await conn.query("INSERT INTO users(id, nickname) VALUES($1, $2)", [email, nickname])
		},
		async get(id: string): Promise<DbUser | undefined> {
			let result = await conn.query<DbUser>("SELECT * FROM users WHERE id = $1", [id])
			return result.rows[0]
		},
	},
	token: {
		async get(token: string) {
			let result = await conn.query<DbUserToken>("SELECT * FROM user_token WHERE token = $1", [token])
			return result.rows[0]
		},
		async create(userId: string) {
			let token = randomBytes(64).toString("base64url")
			let expiration = new Date()
			expiration.setDate(expiration.getDate() + 1)
			await conn.query(
				"INSERT INTO user_token(token, user_id, expiration) VALUES ($1, $2, $3)",
				[token, userId, expiration]
			)
			return token
		},
		async delete(token: string) {
			await conn.query(
				"DELETE FROM user_token WHERE token = $1",
				[token]
			)
		},
	},
}
