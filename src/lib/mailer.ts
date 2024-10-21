import { DbUser } from "./models"

export interface MailerService {
	loginLink(user: DbUser, link: URL): Promise<void>
}

const dev = {
	loginLink: async (user: DbUser, link: URL) => {
		console.log("Email sent: ", {
			subject: "Email Link",
			to: [user.id],
			content: `${link}`,
		})
	},
}

export const mailer: MailerService = dev
