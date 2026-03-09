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

const getPeopleCollection = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User must be authenticated to access people");
  return `users/${userId}/people`;
};

const MOCK_PEOPLE = [
  { fullName: "Priya Desai", role: "Government Official", department: "PWD", ward: "All Wards", phone: "9876543201", email: "priya.pwd@gov.in", notes: "Chief engineer handling major road networks." },
  { fullName: "Amit Patel", role: "Contractor", department: "Infrastructure", ward: "Ward 4", phone: "9876543202", email: "amit.builds@email.com", notes: "Reliable contractor for drainage and road repairs." },
  { fullName: "Sunil Verma", role: "Ward Member", department: "Elected Representative", ward: "Ward 2", phone: "9876543203", email: "sunil.v@ward2.com", notes: "Very active regarding sanitation issues." },
  { fullName: "Dr. Mehra", role: "Government Official", department: "Healthcare", ward: "All Wards", phone: "9876543204", email: "doc.mehra@health.gov", notes: "District Medical Officer overseeing clinics." },
  { fullName: "Neha Singh", role: "Community Leader", department: "NGO", ward: "Ward 9", phone: "9876543205", email: "neha.water@ngo.org", notes: "Vocal advocate for clean drinking water supply." },
  { fullName: "Rajesh Kumar", role: "Government Official", department: "Electricity Board", ward: "All Wards", phone: "9876543206", email: "rajesh.elec@energy.gov", notes: "Point of contact for major outages." },
  { fullName: "Suresh Gupta", role: "Contractor", department: "General", ward: "Ward 1", phone: "9876543207", email: "suresh.contractor@mail.com", notes: "Handles smaller patching and repair jobs." },
  { fullName: "Ramesh Tiwari", role: "Party Worker", department: "Political", ward: "Ward 10", phone: "9876543208", email: "ramesh.t@party.org", notes: "Good connect with local schools and administration." },
  { fullName: "Kavita Reddy", role: "Ward Member", department: "Elected Representative", ward: "Ward 7", phone: "9876543209", email: "kavita.ward7@mail.com", notes: "" },
  { fullName: "Vikram Singh", role: "Community Leader", department: "Residents Welfare", ward: "Ward 5", phone: "9876543210", email: "vikram.rwa@mail.com", notes: "President of the largest RWA in Ward 5." },
  { fullName: "Anita Roy", role: "Government Official", department: "Education", ward: "All Wards", phone: "9876543211", email: "anita.edu@gov.in", notes: "Schools inspector for the district." },
  { fullName: "Karan Johar", role: "Party Worker", department: "Political", ward: "Ward 3", phone: "9876543212", email: "karan.j@party.org", notes: "Youth wing leader." },
  { fullName: "Ravi Kumar", role: "Contractor", department: "Water Supply", ward: "Ward 6", phone: "9876543213", email: "ravi.water@contractors.com", notes: "Specializes in borewells and pipeline laying." },
  { fullName: "Sneha Patel", role: "Ward Member", department: "Elected Representative", ward: "Ward 8", phone: "9876543214", email: "sneha.ward8@mail.com", notes: "Focuses heavily on public park maintenance." },
  { fullName: "Arjun Nair", role: "Government Official", department: "Sanitation", ward: "All Wards", phone: "9876543215", email: "arjun.clean@gov.in", notes: "Head of solid waste management operations." }
];

export const getPeople = async () => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    const peopleRef = collection(db, PEOPLE_COLLECTION);
    const q = query(peopleRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No people found for user, seeding mock data...");
      await seedMockData();
      return getPeople(); // recurse
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
  } catch (error) {
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      console.warn("Index missing for orderBy createdAt desc, falling back to basic query.");
      const PEOPLE_COLLECTION = getPeopleCollection();
      const querySnapshot = await getDocs(collection(db, PEOPLE_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      return data.sort((a, b) => b.createdAt - a.createdAt);
    }
    console.error("Error fetching people:", error);
    throw error;
  }
};

export const getPersonById = async (id) => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    const docRef = doc(db, PEOPLE_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      };
    } else {
      throw new Error("Person not found");
    }
  } catch (error) {
    console.error("Error fetching person details:", error);
    throw error;
  }
};

export const createPerson = async (personData) => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    const docRef = await addDoc(collection(db, PEOPLE_COLLECTION), {
      ...personData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating person:", error);
    throw error;
  }
};

export const updatePerson = async (id, updateData) => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    const personRef = doc(db, PEOPLE_COLLECTION, id);
    await updateDoc(personRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating person:", error);
    throw error;
  }
};

export const deletePerson = async (id) => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    await deleteDoc(doc(db, PEOPLE_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting person:", error);
    throw error;
  }
};

const seedMockData = async () => {
  try {
    const PEOPLE_COLLECTION = getPeopleCollection();
    const peopleRef = collection(db, PEOPLE_COLLECTION);
    for (const person of MOCK_PEOPLE) {
      await addDoc(peopleRef, {
        ...person,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log("Mock people successfully seeded.");
  } catch (error) {
    console.error("Error seeding mock people:", error);
  }
};
