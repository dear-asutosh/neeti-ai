import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(() => sessionStorage.getItem('neeti_jwt_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Retrieve and store JWT (ID Token)
        try {
          const token = await user.getIdToken();
          sessionStorage.setItem('neeti_jwt_token', token);
          setJwtToken(token);
        } catch (tokenError) {
          console.error("Error retrieving JWT token:", tokenError);
        }
        
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
        setCurrentUser(null);
        setUserRole(null);
        setDbUser(null);
        
        // Clear JWT on sign out / lost session
        sessionStorage.removeItem('neeti_jwt_token');
        setJwtToken(null);
        
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
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
    jwtToken, // Exposed for API calls
    loading
  };

  // Only render children when NOT loading AND 
  // either we have no user (public routes) OR we have a user WITH a JWT token (private routes)
  // This strictness prevents rendering authenticated views without a valid JWT in session.
  const isAuthResolved = !loading && ((currentUser && jwtToken) || !currentUser);

  return (
    <AuthContext.Provider value={value}>
      {isAuthResolved && children}
    </AuthContext.Provider>
  );
};
