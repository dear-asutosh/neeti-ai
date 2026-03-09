import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';

const getComplaintsCollection = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User must be authenticated to access complaints");
  return `users/${userId}/complaints`;
};

// Initial Mock Data to seed the database
const MOCK_COMPLAINTS = [
  { citizenName: "Rahul Sharma", phoneNumber: "9876543210", ward: "Ward 1", issueType: "Road", description: "Potholes on the main road causing daily traffic jumps.", priority: "High", assignedTo: "Amit Patel", status: "Pending" },
  { citizenName: "Priya Desai", phoneNumber: "9876543211", ward: "Ward 3", issueType: "Water", description: "No water supply since two days in block B.", priority: "High", assignedTo: "Neha Singh", status: "In Progress" },
  { citizenName: "Sanjay Gupta", phoneNumber: "9876543212", ward: "Ward 5", issueType: "Electricity", description: "Streetlights not working in our lane.", priority: "Medium", assignedTo: "Rajesh Kumar", status: "Resolved" },
  { citizenName: "Kavita Reddy", phoneNumber: "9876543213", ward: "Ward 2", issueType: "Sanitation", description: "Garbage not collected for a week.", priority: "High", assignedTo: "Sunil Verma", status: "Pending" },
  { citizenName: "Vikram Singh", phoneNumber: "9876543214", ward: "Ward 7", issueType: "Healthcare", description: "Local clinic is frequently out of basic meds.", priority: "Medium", assignedTo: "Dr. Mehra", status: "In Progress" },
  { citizenName: "Anita Roy", phoneNumber: "9876543215", ward: "Ward 10", issueType: "Education", description: "School roof needs urgent repair.", priority: "High", assignedTo: "Ramesh Tiwari", status: "Pending" },
  { citizenName: "Karan Johar", phoneNumber: "9876543216", ward: "Ward 4", issueType: "Road", description: "Drainage is overflowing onto the street.", priority: "High", assignedTo: "Amit Patel", status: "Resolved" },
  { citizenName: "Sneha Patel", phoneNumber: "9876543217", ward: "Ward 6", issueType: "Other", description: "Stray dogs issue in the colony park.", priority: "Low", assignedTo: "Sunil Verma", status: "Pending" },
  { citizenName: "Arjun Nair", phoneNumber: "9876543218", ward: "Ward 8", issueType: "Electricity", description: "Frequent power cuts during the night.", priority: "High", assignedTo: "Rajesh Kumar", status: "In Progress" },
  { citizenName: "Meera Menon", phoneNumber: "9876543219", ward: "Ward 9", issueType: "Water", description: "Contaminated water supply.", priority: "High", assignedTo: "Neha Singh", status: "Pending" },
  { citizenName: "Rohan Das", phoneNumber: "9876543220", ward: "Ward 1", issueType: "Sanitation", description: "Public toilet is extremely dirty.", priority: "Medium", assignedTo: "Sunil Verma", status: "Resolved" },
  { citizenName: "Pooja Joshi", phoneNumber: "9876543221", ward: "Ward 2", issueType: "Healthcare", description: "Ambulance not available at night.", priority: "High", assignedTo: "Dr. Mehra", status: "In Progress" }
];

export const getComplaints = async () => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const q = query(complaintsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // If empty, let's seed the database
    if (querySnapshot.empty) {
      console.log("No complaints found for user, seeding mock data...");
      await seedMockData();
      return getComplaints(); // recursive call to get the data after seeding
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // convert firestore timestamp to JS Date if it exists
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
  } catch (error) {
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      // If we are missing index, let's fallback to un-ordered to avoid breaking the app
      console.warn("Index missing for orderBy createdAt desc, falling back to basic query.");
      const COMPLAINTS_COLLECTION = getComplaintsCollection();
      const querySnapshot = await getDocs(collection(db, COMPLAINTS_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      // Sort manually
      return data.sort((a, b) => b.createdAt - a.createdAt);
    }
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

export const getComplaintById = async (id) => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const docRef = doc(db, COMPLAINTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      };
    } else {
      throw new Error("Complaint not found");
    }
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    throw error;
  }
};

export const createComplaint = async (complaintData) => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const docRef = await addDoc(collection(db, COMPLAINTS_COLLECTION), {
      ...complaintData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: [{
        status: complaintData.status || "Pending",
        timestamp: new Date().toISOString(),
        note: "Complaint initially registered."
      }]
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating complaint:", error);
    throw error;
  }
};

export const updateComplaintStatus = async (id, newStatus, note = "") => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    const complaintDoc = await getDoc(complaintRef);
    
    if (complaintDoc.exists()) {
      const data = complaintDoc.data();
      const newTimelineEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${newStatus}`
      };
      
      const updatedTimeline = [...(data.timeline || []), newTimelineEntry];
      
      await updateDoc(complaintRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        timeline: updatedTimeline
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating complaint status:", error);
    throw error;
  }
};

export const updateComplaint = async (id, complaintData) => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    await updateDoc(complaintRef, {
      ...complaintData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating complaint:", error);
    throw error;
  }
};

export const deleteComplaint = async (id) => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    await deleteDoc(doc(db, COMPLAINTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting complaint:", error);
    throw error;
  }
};

const seedMockData = async () => {
  try {
    const COMPLAINTS_COLLECTION = getComplaintsCollection();
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    for (const complaint of MOCK_COMPLAINTS) {
      await addDoc(complaintsRef, {
        ...complaint,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: [{
          status: complaint.status,
          timestamp: new Date().toISOString(),
          note: "Imported from legacy mock system."
        }]
      });
    }
    console.log("Mock data successfully seeded.");
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
};
