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

const getProjectsCollection = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User must be authenticated to access projects");
  return `users/${userId}/projects`;
};

const MOCK_PROJECTS = [
  { projectName: "Ward 4 Pothole Repair Drive", ward: "Ward 4", category: "Road", budgetAllocated: 1500000, budgetSpent: 500000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), status: "In Progress", responsiblePerson: "Suresh Gupta", description: "Comprehensive repair of all major potholes in Ward 4 following monsoon damages." },
  { projectName: "Borewell Installation - Ward 7", ward: "Ward 7", category: "Water Supply", budgetAllocated: 800000, budgetSpent: 800000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), status: "Completed", responsiblePerson: "Ravi Kumar", description: "Drilling and setup of 3 new public borewells to address summer water shortages." },
  { projectName: "Primary School Renovation", ward: "Ward 2", category: "School", budgetAllocated: 3500000, budgetSpent: 1200000, startDate: new Date().toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString(), status: "In Progress", responsiblePerson: "Meena Sharma", description: "Upgrading the municipal primary school infrastructure including new roofs and smart classrooms." },
  { projectName: "Streetlight LED Upgrade", ward: "Ward 5", category: "Electricity", budgetAllocated: 5000000, budgetSpent: 0, startDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString(), status: "Planned", responsiblePerson: "Amit Patel", description: "Replacing all old halogen streetlights with energy-efficient LED fixtures." },
  { projectName: "Community Health Clinic Setup", ward: "Ward 9", category: "Hospital", budgetAllocated: 2000000, budgetSpent: 50000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), status: "On Hold", responsiblePerson: "Dr. Singh", description: "Establishing a new primary health center. Currently delayed due to land clearance issues." },
  { projectName: "Main Drainage Pipeline Overhaul", ward: "Ward 1", category: "Sanitation", budgetAllocated: 4500000, budgetSpent: 2000000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString(), status: "In Progress", responsiblePerson: "Karan Desai", description: "Deep cleaning and expansion of the main sewage pipeline to prevent annual flooding." },
  { projectName: "Public Park Beautification", ward: "Ward 8", category: "Public Infrastructure", budgetAllocated: 1200000, budgetSpent: 1200000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 10)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), status: "Completed", responsiblePerson: "Nita Ambani", description: "Landscaping, jogging tracks, and installation of open-air gym equipment in the central park." },
  { projectName: "Ward 3 Water Tank Construction", ward: "Ward 3", category: "Water Supply", budgetAllocated: 2500000, budgetSpent: 0, startDate: new Date().toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString(), status: "Planned", responsiblePerson: "Ravi Kumar", description: "Construction of a 5L liter overhead water tank to serve 3 adjacent blocks." },
  { projectName: "Local Market Road Concreting", ward: "Ward 10", category: "Road", budgetAllocated: 3000000, budgetSpent: 0, startDate: new Date().toISOString(), deadline: new Date().toISOString(), status: "Cancelled", responsiblePerson: "Suresh Gupta", description: "Project cancelled as the area falls under the new state highway expansion plan." },
  { projectName: "Free Wi-Fi Zones", ward: "Ward 6", category: "Other", budgetAllocated: 500000, budgetSpent: 400000, startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), status: "In Progress", responsiblePerson: "Amit Patel", description: "Setting up 5 free outdoor Wi-Fi hotspots for students and public use." }
];

export const getProjects = async () => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(projectsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No projects found for user, seeding mock data...");
      await seedMockData();
      return getProjects();
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
      const PROJECTS_COLLECTION = getProjectsCollection();
      const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      return data.sort((a, b) => b.createdAt - a.createdAt);
    }
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const getProjectById = async (id) => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      };
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: [{
        status: projectData.status || "Planned",
        timestamp: new Date().toISOString(),
        note: "Project registered in system."
      }]
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProjectStatus = async (id, newStatus, note = "") => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const projectRef = doc(db, PROJECTS_COLLECTION, id);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      const data = projectDoc.data();
      const newTimelineEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: note || `Project status changed to ${newStatus}`
      };
      
      const updatedTimeline = [...(data.timeline || []), newTimelineEntry];
      
      await updateDoc(projectRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        timeline: updatedTimeline
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};

export const updateProject = async (id, updateData) => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const projectRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(projectRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

const seedMockData = async () => {
  try {
    const PROJECTS_COLLECTION = getProjectsCollection();
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    for (const project of MOCK_PROJECTS) {
      await addDoc(projectsRef, {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: [{
          status: project.status,
          timestamp: new Date().toISOString(),
          note: "Imported initial project data."
        }]
      });
    }
    console.log("Mock projects successfully seeded.");
  } catch (error) {
    console.error("Error seeding mock projects:", error);
  }
};
