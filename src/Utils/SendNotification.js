import axios from 'axios';

export const sendPushNotification = async ({ userId, title, body }) => {
    const token = localStorage.getItem("access_token");
    try {
        await axios.post('http://api.avessecurity.com:6378/api/firebase/send-notification', {
            userIds: userId,
            title,
            body,
        },
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    } catch (error) {
        console.error("Push notification error:", error);
    }
};
