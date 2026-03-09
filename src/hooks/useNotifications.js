import { useEffect, useRef, useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';

export function useNotifications() {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState('default');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  // Track notified events so we don't spam the user every minute
  const notifiedEventsRef = useRef(new Set());

  // 1. Check and Set Permission State
  useEffect(() => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Request Permission helper
  const requestPermission = async () => {
    if (!("Notification" in window)) return 'denied';
    
    // Some browsers use callbacks, newer use promises
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    } catch (e) {
      // Fallback for Safari/older browsers
      return new Promise((resolve) => {
        Notification.requestPermission((perm) => {
          setPermission(perm);
          resolve(perm);
        });
      });
    }
  };

  // 2. Fetch all upcoming events for today (to reduce snapshot size)
  useEffect(() => {
    if (!currentUser?.uid || permission !== 'granted') return;

    // Get today's start and end timestamps to avoid fetching the whole calendar and keep memory light
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // We fetch a bit into the future (e.g., end of tomorrow) to handle "1 day before" reminders properly
    const tomorrowEnd = new Date(today);
    tomorrowEnd.setDate(today.getDate() + 2);

    const q = query(
      collection(db, 'users', currentUser.uid, 'scheduleEvents'),
      where('startTime', '>=', Timestamp.fromDate(today)),
      where('startTime', '<=', Timestamp.fromDate(tomorrowEnd))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          reminder: data.reminder || 'none',
          startTime: data.startTime ? data.startTime.toDate() : null
        };
      }).filter(e => e.startTime !== null);
      
      setUpcomingEvents(events);
    }, (err) => {
      console.error("Notification Event Fetch Error:", err);
    });

    return () => unsubscribe();
  }, [currentUser, permission]);


  // 3. Poll every minute to send notifications
  useEffect(() => {
    if (permission !== 'granted' || upcomingEvents.length === 0) return;

    const checkReminders = () => {
      const now = new Date();

      upcomingEvents.forEach(event => {
        if (event.reminder === 'none') return;
        
        let reminderMinutes = 0;
        if (event.reminder === '15min') reminderMinutes = 15;
        if (event.reminder === '1hr') reminderMinutes = 60;
        if (event.reminder === '1day') reminderMinutes = 1440;

        // Calculate when the reminder SHOULD trigger
        const reminderTime = new Date(event.startTime.getTime() - (reminderMinutes * 60000));
        
        // Check if current time is reasonably close to the reminder time (e.g within a 1 minute window)
        // and if we haven't already notified about it
        const diffInMs = now.getTime() - reminderTime.getTime();
        
        // If we are somewhat past the trigger time (0 to 2 minutes) we send it once
        if (diffInMs >= 0 && diffInMs < (2 * 60000) && !notifiedEventsRef.current.has(event.id)) {
          
          const timeStr = event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          const notification = new Notification(`Reminder: ${event.title}`, {
            body: `Starting at ${timeStr}${event.description ? `\n${event.description}` : ''}`,
            icon: '/favicon.ico', // Update if you have an app icon
            tag: event.id // prevents duplicates visually
          });

          notification.onclick = () => {
            window.focus();
            // Could navigate to /schedule if needed via router logic
          };

          // Mark as notified so we don't spam them on the next minute tick
          notifiedEventsRef.current.add(event.id);
        }
      });
    };

    // Run once immediately
    checkReminders();
    
    // Then run every 60 seconds
    const intervalId = setInterval(checkReminders, 60000);

    return () => clearInterval(intervalId);
  }, [permission, upcomingEvents]);

  return {
    permission,
    requestPermission,
    isSupported: "Notification" in window
  };
}
