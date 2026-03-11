import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, generateAuthToken, clearAuthToken } from '../services/firebase';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    // Listen to Firebase auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          // Generate and store JWT token for this user
          try {
            const token = generateAuthToken(user);
            setJwtToken(token);
          } catch (tokenError) {
            console.error("Error generating JWT token:", tokenError);
            setJwtToken(null);
          }
          
          // Fetch user data from Firestore
          const docRef = doc(db, 'users', user.uid);
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserRole(docSnap.data().role);
              setDbUser(docSnap.data());
            } else {
              setUserRole(null);
              setDbUser(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching user role:", error);
            setLoading(false);
          });
        } else {
          // No user logged in
          setCurrentUser(null);
          setUserRole(null);
          setDbUser(null);
          setJwtToken(null);
          clearAuthToken();
          
          if (unsubscribeDoc) {
            unsubscribeDoc();
            unsubscribeDoc = null;
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    dbUser,
    jwtToken,
    loading
  };

  // Render children only when auth state has been resolved
  // This prevents flashing or rendering auth-protected content before we know if user is logged in
  const isAuthResolved = !loading;

  return (
    <AuthContext.Provider value={value}>
      {isAuthResolved && children}
    </AuthContext.Provider>
  );
};
