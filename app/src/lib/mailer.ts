import { DbUser } from "./models"
import sgMail from '@sendgrid/mail'

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

let apiKey = process.env.SENDGRID_API_KEY
if (apiKey) {
	let sender = process.env.SENDGRID_SENDER
	if (!sender) throw Error("Sendgrid sender setting missing")
	sgMail.setApiKey(apiKey)
	send = async (incompleteMessage: EmailMessage) => {
		let message = {
			...incompleteMessage,
			from: sender,
		}
		return sgMail
			.send(message)
			.then(() => {
				console.log(`Email sent: ${incompleteMessage.subject}`)
			})
			.catch((error) => {
				console.error(error)
			})
	}
}



