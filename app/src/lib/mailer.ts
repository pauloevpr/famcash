import { DbUser } from "./models"
import postmark from "postmark"

type EmailMessage = {
	to: string
	subject: string
} & ({ text: string } | { html: string })

export const mailer = {
	loginMessage: async (user: DbUser, link: URL) => {
		send({
			subject: "Login Link for FamCash",
			to: user.email,
			text: `Hi ${user.name},\n\nHere is your one-time link to login to your FamCash account:\n\n${link}\n\nIf you didn't request this email, you can safely ignore and delete this message. Someone might have entered your email by accident.\n\nRegards,\nFamCash Team\n\n`,
		})
	},
	signUpMessage: async (email: string, link: URL) => {
		send({
			subject: "Welcome to FamCash",
			to: email,
			text: `Hi there,\n\nWelcome to FamCash!\n\nUse the link below to confim and login to your FamCash account:\n\n${link}\n\nIf you didn't request this email, you can safely ignore and delete this message. Someone might have entered your email by accident.\n\nRegards,\nFamCash Team\n\n`,
		})
	}
}


let send = async (msg: EmailMessage) => {
	console.log("Dev email: ", msg)
}

let apiKey = process.env.MAILER_API_KEY
if (apiKey) {
	let sender = process.env.MAILER_SENDER
	if (!sender) throw Error("Sendgrid sender setting missing") // Send an email: var client = new postmark.ServerClient(process.MAILER_API_KEY);
	let client = new postmark.ServerClient(apiKey);

	send = async (message: EmailMessage) => {
		client.sendEmail({
			"From": sender,
			"To": message.to,
			"Subject": message.subject,
			"HtmlBody": message.text,
			"TextBody": message.html,
			"MessageStream": "outbound"
		}).then(() => {
			console.log(`Email sent: ${message.subject}`)
		})
			.catch((error) => {
				console.error(error)
			})
	}
}



