import { DbUser } from "./models"

export interface MailerService {
	loginLink(user: DbUser, link: URL): Promise<void>
	signupLink(email: string, link: URL): Promise<void>
}

const dev = {
	loginLink: async (user: DbUser, link: URL) => {
		console.log("Email sent: ", {
			subject: "Login Link",
			to: [user.email],
			content: `${link}`,
		})
	},
	signupLink: async (email: string, link: URL) => {
		console.log("Email sent: ", {
			subject: "Signup Link",
			to: [email],
			content: `${link}`,
		})
	}
}

export const mailer: MailerService = dev
