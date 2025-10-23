import { AlertTriangle, Bell, X } from "lucide-react"

const Notification = ({showNotification, setShowNotification, notification}) => {
    return (
            <div  className={showNotification ? " notification show" : " notification"} onClick={() => setShowNotification(false)}>
                <h3>
                    {notification.type === 'info' ? <Bell color="blue" /> : <AlertTriangle color="red" />}
                    {notification.title} 
                    <X className="x"/>
                </h3>

                <p>{notification.message}</p>
            </div>
    )
}


export default Notification;