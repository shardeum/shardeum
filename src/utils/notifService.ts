import axios from 'axios'

const notificationServer = process.env.NOTIF_SERVER
const messageToken = process.env.NOTIF_TOKEN

export async function sendMessage(message: string): Promise<void> {
  if (!notificationServer || !messageToken) {
    console.error('Notification server not initialized. Missing required environment variables.')
    return
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
