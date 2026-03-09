import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Trash2, X, AlertCircle, MapPin, Bell, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const CATEGORY_STYLES = {
  'Meeting': 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/40',
  'Deadline': 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/40',
  'Public Event': 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/40',
  'Personal': 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40'
};

const CATEGORY_DOT_STYLES = {
  'Meeting': 'bg-indigo-600 dark:bg-indigo-500',
  'Deadline': 'bg-rose-600 dark:bg-rose-500',
  'Public Event': 'bg-amber-600 dark:bg-amber-500',
  'Personal': 'bg-emerald-600 dark:bg-emerald-500'
};

export default function Schedule() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // 'month' | 'week' | 'agenda'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals & Popups
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Native Notifications
  const { permission, requestPermission } = useNotifications();
  
  // Create Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Meeting',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    startHour: '09',
    startMinute: '00',
    endHour: '10',
    endMinute: '00',
    reminder: '15min'
  });

  const [formError, setFormError] = useState('');

  // 1. Firebase Listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(
      collection(db, 'users', currentUser.uid, 'scheduleEvents'), 
      orderBy('startTime', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JS Dates
          startTime: data.startTime ? data.startTime.toDate() : new Date(),
          endTime: data.endTime ? data.endTime.toDate() : new Date(),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
        };
      });
      setEvents(fetchedEvents);
    }, (error) => {
      console.error("Error fetching events:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const closeCreateModal = () => {
    setShowModal(false);
    setFormError('');
    setForm({
      title: '',
      description: '',
      category: 'Meeting',
      date: new Date().toISOString().split('T')[0],
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      reminder: '15min'
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!form.date) {
      setFormError('Date is required');
      return;
    }

    const startStr = `${form.date}T${form.startHour}:${form.startMinute}:00`;
    const endStr = `${form.date}T${form.endHour}:${form.endMinute}:00`;
    
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);

    if (endObj <= startObj) {
      setFormError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create Firestore Date object
      const eventData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        startTime: Timestamp.fromDate(startObj),
        endTime: Timestamp.fromDate(endObj),
        reminder: form.reminder,
        googleEventId: null,
        createdAt: Timestamp.now()
      };

      // Create in Firestore
      await addDoc(collection(db, 'users', currentUser.uid, 'scheduleEvents'), eventData);

      closeCreateModal();
    } catch (err) {
      console.error("Error creating event:", err);
      setFormError('Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid, 'scheduleEvents', selectedEvent.id));
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event.");
    }
  };

  // ------------------------------------------------------------------
  // Calendar Helpers
  // ------------------------------------------------------------------
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  
  const increaseMonthLocal = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const decreaseMonthLocal = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const increaseWeekLocal = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
  };
  const decreaseWeekLocal = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
  };

  const isToday = (dateObj) => {
    const today = new Date();
    return dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  };

  const isPastEvent = (endTime) => {
    return endTime < new Date();
  };

  // Utility to pad numbers
  const padTo2 = (num) => num.toString().padStart(2, '0');

  // Format time nicely 
  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  

  // ------------------------------------------------------------------
  // RENDER VIEWS
  // ------------------------------------------------------------------

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year); // 0 (Sun) to 6 (Sat)
    
    // Previous month info
    const prevMonthDays = daysInMonth(month - 1, year);
    
    const calendarCells = [];
    
    // Fill previous month trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const dateObj = new Date(year, month - 1, dayNum);
      calendarCells.push({ date: dateObj, isCurrentMonth: false, dayNum });
    }
    
    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(year, month, i);
      calendarCells.push({ date: dateObj, isCurrentMonth: true, dayNum: i });
    }
    
    // Fill next month leading days
    const remainingCells = 42 - calendarCells.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const dateObj = new Date(year, month + 1, i);
      calendarCells.push({ date: dateObj, isCurrentMonth: false, dayNum: i });
    }

    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300 transition-all">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={decreaseMonthLocal} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-zinc-700">
              Today
            </button>
            <button onClick={increaseMonthLocal} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container (no forced scroll) */}
        <div className="w-full">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 transition-colors">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                <span className="md:hidden">{day.charAt(0)}</span>
                <span className="hidden md:inline">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 grid-rows-6">
            {calendarCells.map((cell, idx) => {
              const dayEvents = events.filter(e => isSameDay(e.startTime, cell.date));
              const hasMoreEvents = dayEvents.length > 3;
              const displayedEvents = dayEvents.slice(0, 3);
              
              const isTodayCell = isToday(cell.date);

              return (
                <div 
                  key={idx} 
                  className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-r border-b border-gray-100 dark:border-zinc-800/50 group relative ${!cell.isCurrentMonth ? 'bg-gray-50/50 dark:bg-zinc-950/30' : 'bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/30'} flex flex-col gap-1 transition-colors`}
                  onClick={() => {
                    // Quick add on mobile by tapping cell (if it's the current month)
                    if (window.innerWidth < 768 && cell.isCurrentMonth) {
                      const localDateStr = new Date(cell.date.getTime() - (cell.date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                      setForm(prev => ({...prev, date: localDateStr}));
                      setShowModal(true);
                    }
                  }}
                >
                  <div className="flex justify-center md:justify-between items-start mb-1 cursor-pointer">
                    <span className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-xs md:text-sm font-bold transition-all
                      ${!cell.isCurrentMonth ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-300'}
                      ${isTodayCell ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : ''}
                    `}>
                      {cell.dayNum}
                    </span>
                    {cell.isCurrentMonth && (
                      <button 
                        className="hidden md:block opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all border border-transparent hover:border-gray-300 dark:hover:border-zinc-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          const localDateStr = new Date(cell.date.getTime() - (cell.date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                          setForm(prev => ({...prev, date: localDateStr}));
                          setShowModal(true);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Desktop Events (Text Blocks) */}
                  <div className="hidden md:flex flex-1 flex-col gap-1 overflow-y-auto hide-scrollbar">
                    {displayedEvents.map(evt => {
                      const isPast = isPastEvent(evt.endTime);
                      return (
                        <div 
                          key={evt.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`text-[10px] md:text-xs truncate px-1.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all shadow-xs ${CATEGORY_STYLES[evt.category] || CATEGORY_STYLES['Meeting']} ${isPast ? 'opacity-40 grayscale-[50%] border-dashed' : ''}`}
                        >
                          {formatTime(evt.startTime)} - {evt.title}
                        </div>
                      );
                    })}
                    {hasMoreEvents && (
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1 font-bold cursor-pointer hover:text-indigo-600 dark:hover:text-zinc-400 transition-colors">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Mobile Events (Dots) */}
                  <div className="flex md:hidden flex-wrap justify-center gap-1 mt-auto pb-1 px-1">
                    {dayEvents.slice(0, 4).map(evt => {
                      const isPast = isPastEvent(evt.endTime);
                      // Extract color roughly from CATEGORY_STYLES or fallback to indigo
                      const dotColor = evt.category === 'Deadline' ? 'bg-rose-500' 
                                   : evt.category === 'Public Event' ? 'bg-amber-500'
                                   : evt.category === 'Personal' ? 'bg-emerald-500'
                                   : 'bg-indigo-500';
                      
                      return (
                        <div 
                          key={evt.id}
                          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isPast ? 'opacity-40 grayscale-[50%]' : ''}`}
                        />
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Determine start of the week (Sunday)
    let startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day; // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(nextDay);
    }

    const endOfWeek = weekDays[6];

    // Build Time Rows (6 AM to 10 PM)
    const hours = [];
    for (let i = 6; i <= 22; i++) {
        hours.push(i);
    }
    const HOUR_HEIGHT = 60; // pax

    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[700px] animate-in fade-in duration-300 transition-all">
         {/* Week Navigation */}
         <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 shrink-0 transition-colors">
          <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 transition-colors">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={decreaseWeekLocal} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-zinc-700">
              Today
            </button>
            <button onClick={increaseWeekLocal} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex flex-1 overflow-x-auto overflow-y-auto relative bg-gray-50 dark:bg-zinc-950 transition-colors">
          <div className="flex-1 flex min-w-[900px]">
            {/* Day Columns */}
            {weekDays.map(dayObj => {
              // Sort events by start time
              const dayEvents = events.filter(e => isSameDay(e.startTime, dayObj)).sort((a, b) => a.startTime - b.startTime);
              const today = isToday(dayObj);

              return (
                <div key={dayObj.getDay()} className={`flex-1 flex flex-col min-w-0 border-r border-gray-100 dark:border-zinc-800/50 ${today ? 'bg-indigo-500/5' : ''} transition-colors`}>
                  {/* Day Header */}
                  <div className="p-3 text-center border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 shrink-0 transition-all">
                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${today ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-400'}`}>
                      {dayObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`block text-lg font-black mt-0.5 ${today ? 'text-indigo-500 dark:text-indigo-300' : 'text-zinc-900 dark:text-zinc-200'}`}>
                      {dayObj.getDate()}
                    </span>
                  </div>
                  
                  {/* Day Events Stack */}
                  <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                    {dayEvents.map(evt => {
                      const isPast = isPastEvent(evt.endTime);
                      return (
                        <div
                          key={evt.id}
                          className={`rounded-lg p-2.5 border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col gap-1.5 shadow-xs ${CATEGORY_STYLES[evt.category] || CATEGORY_STYLES['Meeting']} ${isPast ? 'opacity-50 grayscale bg-gray-50 dark:bg-zinc-950/40 border-dashed border-gray-300 dark:border-zinc-700' : ''}`}
                          onClick={() => setSelectedEvent(evt)}
                        >
                          <div className={`text-xs font-bold leading-tight ${isPast ? 'text-zinc-400 dark:text-zinc-400 line-through decoration-zinc-500/50' : 'text-inherit'}`}>
                            {evt.title}
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isPast ? 'text-zinc-500' : 'opacity-90'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                          </div>
                          {evt.reminder && evt.reminder !== 'none' && !isPast && (
                            <div className="flex items-center gap-1 mt-0.5 text-[9px] opacity-80 uppercase tracking-widest font-bold">
                              <Bell className="w-2.5 h-2.5" />
                              <span>{evt.reminder.replace('hr','h ').replace('min','m')}</span>
                            </div>
                          )}
                          {isPast && (
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Passed</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    // Only upcoming starting from right now
    const now = new Date();

    const upcomingEvents = events.filter(e => e.endTime >= now);
    const pastEvents = events.filter(e => e.endTime < now).reverse(); // Reverse for more recent first

    // Group by Date String
    const groupEvents = (evtList) => {
      const groups = {};
      evtList.forEach(evt => {
        let dateKey = evt.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (isToday(evt.startTime)) dateKey = 'Today';
        else if (isSameDay(evt.startTime, new Date(new Date().setDate(new Date().getDate() + 1)))) dateKey = 'Tomorrow';

        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(evt);
      });
      return groups;
    };

    const upcomingGroups = groupEvents(upcomingEvents);

    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm p-4 md:p-6 animate-in fade-in duration-300 transition-all">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight transition-colors">Upcoming Schedule</h2>
        
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-100/30 dark:bg-zinc-950/20 transition-all">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 transition-colors">
              <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-300 mb-2 transition-colors">No upcoming events</h3>
            <p className="text-zinc-500 dark:text-zinc-500 max-w-sm mb-6 transition-colors">Your schedule is clear. Enjoy the free time or add a new event to stay organized.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(upcomingGroups).map(dateKey => (
              <div key={dateKey} className="space-y-4">
                <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md py-2 z-10 border-b border-gray-100 dark:border-zinc-800/50 flex items-center gap-3 transition-colors">
                  <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${dateKey === 'Today' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {dateKey}
                  </h3>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800/50 transition-colors"></div>
                </div>
                
                <div className="grid gap-3">
                  {upcomingGroups[dateKey].map(evt => (
                    <div 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className="group bg-gray-50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 p-4 rounded-xl flex items-start gap-4 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-sm font-black text-zinc-900 dark:text-zinc-200 transition-colors">{formatTime(evt.startTime)}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 uppercase font-bold transition-colors">{formatTime(evt.endTime)}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0 border-l border-gray-100 dark:border-zinc-800/60 pl-4 py-0.5 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full transition-colors ${CATEGORY_DOT_STYLES[evt.category] || CATEGORY_DOT_STYLES['Meeting']}`}></span>
                          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors">{evt.category}</span>
                        </div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{evt.title}</h4>
                        {evt.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed transition-colors">{evt.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Short Past section */}
        {pastEvents.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800 transition-colors">
            <details className="group">
              <summary className="text-sm font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer list-none flex items-center gap-2 tracking-wider uppercase transition-all duration-300">
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                Past Events ({pastEvents.length})
              </summary>
              <div className="mt-4 space-y-3 pl-6">
                {pastEvents.slice(0, 10).map(evt => (
                  <div key={evt.id} className="flex items-center justify-between text-sm p-3 bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-100 dark:border-zinc-800/50 rounded-lg hover:border-gray-200 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs" onClick={() => setSelectedEvent(evt)}>
                    <div className="flex items-center gap-3">
                       <span className={`w-2 h-2 rounded-full opacity-50 ${CATEGORY_DOT_STYLES[evt.category] || CATEGORY_DOT_STYLES['Meeting']}`}></span>
                       <span className="text-zinc-600 dark:text-zinc-400 font-bold">{evt.title}</span>
                    </div>
                    <span className="text-zinc-400 dark:text-zinc-600 text-xs font-medium">{evt.startTime.toLocaleDateString()}</span>
                  </div>
                ))}
                {pastEvents.length > 10 && <p className="text-xs text-zinc-600 italic">...and {pastEvents.length - 10} more older events.</p>}
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------------
  return (
    <div className="min-h-full bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-6 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Notifications Banner */}
        {permission !== 'granted' && permission !== 'denied' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-100">Enable Desktop Notifications</h3>
                <p className="text-xs text-amber-300/80">Get timely alerts for your upcoming meetings and events.</p>
              </div>
            </div>
            <button 
              onClick={requestPermission}
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Turn On Alerts
            </button>
          </div>
        )}

        {/* 2. Top Bar (Tabs + Add Button) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl flex border border-gray-100 dark:border-zinc-800 w-full sm:w-auto overflow-x-auto hide-scrollbar transition-colors shadow-xs">
            {[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'agenda', label: 'Agenda' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                  view === tab.id 
                    ? 'bg-gray-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white shadow-xs' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-4 h-4 text-indigo-100" /> New Event
          </button>
        </div>

        {/* 3. Main Views */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'agenda' && renderAgendaView()}
        
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODALS */}
      {/* ------------------------------------------------------------------ */}

      {/* CREATE EVENT MODAL */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 shrink-0 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Create Event</h3>
              <button onClick={closeCreateModal} className="p-2 -mr-2 text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {formError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-300/90">{formError}</p>
                </div>
              )}

              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Weekly Strategy Meeting"
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Agenda or notes..."
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                    >
                      {Object.keys(CATEGORY_STYLES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Date *</label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Start Time *</label>
                     <div className="flex gap-2">
                       <select value={form.startHour} onChange={e => setForm({...form, startHour: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs">
                         {Array.from({length: 24}).map((_, i) => <option key={`sh-${i}`} value={padTo2(i)}>{padTo2(i)}</option>)}
                       </select>
                       <span className="self-center font-bold text-zinc-400 dark:text-zinc-500 transition-colors">:</span>
                       <select value={form.startMinute} onChange={e => setForm({...form, startMinute: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs">
                         {Array.from({length: 12}).map((_, i) => <option key={`sm-${i}`} value={padTo2(i * 5)}>{padTo2(i * 5)}</option>)}
                       </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">End Time *</label>
                     <div className="flex gap-2">
                       <select value={form.endHour} onChange={e => setForm({...form, endHour: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs">
                         {Array.from({length: 24}).map((_, i) => <option key={`eh-${i}`} value={padTo2(i)}>{padTo2(i)}</option>)}
                       </select>
                       <span className="self-center font-bold text-zinc-400 dark:text-zinc-500 transition-colors">:</span>
                       <select value={form.endMinute} onChange={e => setForm({...form, endMinute: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs">
                         {Array.from({length: 12}).map((_, i) => <option key={`em-${i}`} value={padTo2(i * 5)}>{padTo2(i * 5)}</option>)}
                       </select>
                     </div>
                  </div>
                </div>

                {/* Reminder */}
                <div>
                    <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 transition-colors">Reminder</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3.5 top-[13px] text-zinc-400 dark:text-zinc-500 pointer-events-none transition-colors" />
                      <select
                        value={form.reminder}
                        onChange={(e) => setForm({...form, reminder: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-900 dark:text-zinc-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        <option value="15min">15 minutes before</option>
                        <option value="1hr">1 hour before</option>
                        <option value="1day">1 day before</option>
                        <option value="none">No reminder</option>
                      </select>
                    </div>
                  </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 shrink-0 transition-colors">
               <button 
                type="button" 
                onClick={closeCreateModal}
                className="px-4 py-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all"
               >
                 Cancel
               </button>
               <button 
                type="submit" 
                form="create-event-form"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-900/20"
               >
                 {isSubmitting ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                 ) : (
                   'Save Event'
                 )}
               </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* EVENT DETAIL POPUP */}
      {selectedEvent && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all">
              
              {/* Header Colored Banner */}
              <div className={`h-2 w-full ${CATEGORY_DOT_STYLES[selectedEvent.category] || CATEGORY_DOT_STYLES['Meeting']}`}></div>

              <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${CATEGORY_STYLES[selectedEvent.category] || CATEGORY_STYLES['Meeting']}`}>
                      {selectedEvent.category}
                    </span>
                    <button onClick={() => setSelectedEvent(null)} className="p-1 -mr-1 -mt-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                 </div>

                 <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 leading-tight pr-4 transition-colors">
                   {selectedEvent.title}
                 </h2>
                 
                 <div className="space-y-4 mt-6">
                    <div className="flex items-start gap-3">
                       <Calendar className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5 transition-colors" />
                       <div>
                         <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 transition-colors">
                            {selectedEvent.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                         </p>
                         <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 transition-colors">
                            {formatTime(selectedEvent.startTime)} – {formatTime(selectedEvent.endTime)}
                         </p>
                       </div>
                    </div>

                    {selectedEvent.description && (
                      <div className="flex items-start gap-3">
                         <div className="w-5 shrink-0" /> {/* Spacer instead of icon if we want clean look, or use MapPin hidden */}
                         <div className="bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800/80 rounded-xl p-4 w-full transition-colors">
                           <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors">{selectedEvent.description}</p>
                         </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                       <Clock className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0 transition-colors" />
                       <p className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors">
                          Reminder: <span className="text-zinc-900 dark:text-zinc-300 font-bold capitalize">{selectedEvent.reminder === 'none' ? 'None' : selectedEvent.reminder.replace('hr', ' hour').replace('min', ' mins').replace('day', ' day(s)')} before</span>
                       </p>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-between items-center transition-colors">
                 <p className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase font-black tracking-wider transition-colors">
                   Created: {selectedEvent.createdAt.toLocaleDateString()}
                 </p>
                 <button 
                  onClick={handleDeleteEvent}
                  className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors group flex items-center gap-2"
                  title="Delete event"
                 >
                   <Trash2 className="w-4 h-4" />
                   <span className="text-xs font-medium pr-1 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 origin-right transition-all -mr-6 group-hover:mr-0 hidden sm:block">Delete</span>
                 </button>
              </div>
           </div>
        </div>
      , document.body)}

    </div>
  );
}
