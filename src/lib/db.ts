import pg from "pg"
import { DbUserToken, DbUser, DbRecordType, DbRecord } from "./models";
import { randomBytes } from "crypto";

const { Pool } = pg
const conn = new Pool({
	connectionString: process.env.DB_CONNECTION,
});

export const db = {
	user: {
		async create(email: string, name: string) {
			await conn.query("INSERT INTO users(id, name) VALUES($1, $2)", [email, name])
		},
		async get(id: string): Promise<DbUser | undefined> {
			let result = await conn.query<DbUser>("SELECT * FROM users WHERE id = $1", [id])
			return result.rows[0]
		},
		async update(user: DbUser) {
			await conn.query(
				"UPDATE users set name = $1 WHERE id = $2",
				[user.name, user.id]
			)
		}
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
	record: {
		async upatedSince(userId: string, since: Date) {
			let result = await conn.query<DbRecord>(
				`SELECT * FROM records 
				 WHERE user_id = $1 AND updated_at > $2
				 ORDER BY updated_at DESC
				`,
				[userId, since]
			)
			return result.rows
		},
		async upsert(
			userId: string,
			recordId: string,
			recordType: DbRecordType,
			deleted: boolean,
			data: { [key: string]: any }
		) {
			if (deleted) {
				data = {}
			}
			let now = new Date()
			await conn.query(`
				INSERT INTO records (id, type, user_id, created_at, updated_at, deleted, data)
				VALUES ($1,$2,$3,$4,$5,$6,$7)
				ON CONFLICT (id, type, user_id)
				DO UPDATE SET
					deleted = EXCLUDED.deleted,
					data = EXCLUDED.data,
					updated_at = EXCLUDED.updated_at
			`,
				[recordId, recordType, userId, now, now, deleted, data]
			)
		},
	},
}
