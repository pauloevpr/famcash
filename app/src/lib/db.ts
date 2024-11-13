import pg from "pg"
import { DbLoginToken, DbUser, DbRecordType, DbRecord, DbMember, DbFamily, DbSignupToken, MemberUser, DbInvite } from "./models";
import { randomBytes } from "crypto";

const { Pool } = pg
const conn = new Pool({
	connectionString: process.env.DB_CONNECTION,
});

export const db = {
	user: {
		async create(email: string, name: string) {
			let result = await conn.query(
				"INSERT INTO users(email, name) VALUES($1, $2) RETURNING id",
				[email.trim(), name.trim()]
			)
			let id = result.rows[0]["id"] as number
			return (await this.get(id))!
		},
		async getByEmail(email: string): Promise<DbUser | undefined> {
			let result = await conn.query<DbUser>(
				"SELECT * FROM users WHERE email = $1",
				[email]
			)
			return result.rows[0]
		},
		async get(id: number): Promise<DbUser | undefined> {
			let result = await conn.query<DbUser>(
				"SELECT * FROM users WHERE id = $1",
				[id]
			)
			return result.rows[0]
		},
		async update(id: number, name: string) {
			await conn.query(
				"UPDATE users set name = $1 WHERE id = $2",
				[name.trim(), id]
			)
		},
	},
	token: {
		signup: {
			async create(email: string) {
				let token = randomBytes(64).toString("base64url")
				let expiration = new Date()
				expiration.setDate(expiration.getDate() + 7)
				await conn.query(
					`INSERT INTO signup_token (token, email, expiration)
					 VALUES ($1,$2,$3)
					 ON CONFLICT (email)
					 DO UPDATE SET
							token = EXCLUDED.token,
							expiration = EXCLUDED.expiration,
							created_at = NOW()
					`,
					[token, email, expiration]
				)
				return token
			},
			async get(token: string) {
				let result = await conn.query<DbSignupToken>(
					"SELECT * FROM signup_token WHERE token = $1",
					[token]
				)
				return result.rows[0]
			},
			async delete(token: string) {
				await conn.query(
					"DELETE FROM signup_token WHERE token = $1",
					[token]
				)
			},
		},
		login: {
			async get(token: string) {
				let result = await conn.query<DbLoginToken>(
					"SELECT * FROM login_token WHERE token = $1",
					[token]
				)
				return result.rows[0]
			},
			async create(userId: number) {
				let token = randomBytes(64).toString("base64url")
				let expiration = new Date()
				expiration.setDate(expiration.getDate() + 1)
				await conn.query(
					"INSERT INTO login_token(token, user_id, expiration) VALUES ($1, $2, $3)",
					[token, userId, expiration]
				)
				return token
			},
			async delete(token: string) {
				await conn.query(
					"DELETE FROM login_token WHERE token = $1",
					[token]
				)
			},
		},
	},
	family: {
		async create(user_id: number, name: string, currency: string) {
			let result = await conn.query(
				"INSERT INTO family (name, created_by, currency) VALUES ($1, $2, $3) RETURNING id",
				[name.trim(), user_id, currency]
			)
			let id = result.rows[0]["id"] as number
			return (await this.get(id))!
		},
		async forUser(userId: number) {
			let result = await conn.query<DbFamily>(
				`SELECT * 
				 FROM family 
				 INNER JOIN member ON member.family_id = family.id
				 WHERE member.user_id = $1
				 LIMIT 1`,
				[userId]
			)
			return result.rows[0]
		},
		async get(id: number) {
			let result = await conn.query<DbFamily>(
				"SELECT * FROM family WHERE id = $1",
				[id]
			)
			return result.rows[0]
		}
	},
	member: {
		async forFamily(familyId: number) {
			let result = await conn.query<MemberUser>(
				`SELECT	
						users.id as id, 
						users.name as name, 
						member.admin as admin
				 FROM member
				 INNER JOIN users ON member.user_id = users.id
				 WHERE member.family_id = $1`,
				[familyId]
			)
			return result.rows
		},
		async forUser(userId: number) {
			let result = await conn.query<DbMember>(
				"SELECT * FROM member WHERE user_id = $1",
				[userId]
			)
			return result.rows
		},
		async create(userId: number, familyId: number, role: "admin" | "regular", invitedBy?: number) {
			await conn.query(
				"INSERT INTO member (user_id, family_id, invited_by, admin) VALUES ($1,$2,$3,$4)",
				[userId, familyId, invitedBy ?? userId, role === "admin"]
			)
		},
		async assureExists(userId: number, familyId: number, admin?: boolean) {
			let memberships = await this.forUser(userId)
			let hasPermission = memberships.some(
				member => member.family_id === familyId && (admin === undefined || member.admin === admin)
			)
			if (!hasPermission) {
				throw Error("user does not have permissions")
			}
		}
	},
	record: {
		async upatedSince(familyId: number, since: Date) {
			let result = await conn.query<DbRecord>(
				`SELECT * FROM records 
				 WHERE family_id = $1 AND updated_at > $2
				 ORDER BY updated_at DESC
				`,
				[familyId, since]
			)
			return result.rows
		},
		async upsert(
			familyId: number,
			userId: number,
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
				INSERT INTO records (id, type, family_id, created_by, created_at, updated_at, updated_by, deleted, data)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
				ON CONFLICT (id, type, family_id)
				DO UPDATE SET
					deleted = EXCLUDED.deleted,
					data = EXCLUDED.data,
					updated_by = EXCLUDED.updated_by,
					updated_at = EXCLUDED.updated_at
			`,
				[recordId, recordType, familyId, userId, now, now, userId, deleted, data]
			)
		},
	},
	invite: {
		async create(userId: number, familyId: number) {
			let code = randomBytes(64).toString("base64url")
			let expiration = new Date()
			expiration.setMinutes(expiration.getMinutes() + 30)
			await conn.query<DbInvite>(
				"INSERT INTO invite (code, created_by, family_id, expired_at) VALUES ($1,$2,$3,$4)",
				[code, userId, familyId, expiration]
			)
			return await this.get(code)
		},
		async get(code: string) {
			let result = await conn.query<DbInvite>(
				"SELECT * FROM invite WHERE code = $1",
				[code]
			)
			return result.rows[0]
		},
		async delete(code: string) {
			await conn.query(
				"DELETE FROM invite WHERE code = $1",
				[code]
			)
		},
	},
}
