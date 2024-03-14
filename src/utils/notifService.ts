import axios from 'axios'

const notificationServer = process.env.NOTIF_SERVER
const messageToken = process.env.NOTIF_TOKEN

const previousMessages: string[] = []

export async function sendMessage(message: string, sentAlready: string = undefined): Promise<void> {
  if (!notificationServer || !messageToken) {
    console.error('Notification server not initialized. Missing required environment variables.')
    return
  }

  if (sentAlready) {
    if (previousMessages.includes(sentAlready)) {
      console.log('Message already sent:', sentAlready)
      return
    }
    previousMessages.push(sentAlready)
  }

  try {
    await axios.post(`${notificationServer}/send-message`, {
      message: message,
      token: messageToken,
    })
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
