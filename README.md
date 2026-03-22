# Neeti AI: The Governance Intelligence OS

> **India's First AI-Native Command Center for Public Leaders.**

Neeti AI is a high-performance administrative operating system designed to empower government officials, legislators, and public administrators. By fusing real-time constituency data with cutting-edge Large Language Models (LLMs), Neeti AI transforms fragmented paperwork into a unified, actionable intelligence dashboard.

---

## 🏛️ Executive Summary

In a landscape of data overload and manual bureaucracy, Neeti AI acts as a **Strategic Force Multiplier**. It automates the "labor" of governance—summarizing 100-page circulars, transcribing hours of meetings, and drafting official communications—allowing leaders to focus on **high-impact vision and decision-making**.

**Core Value Proposition:**
- **Zero-Latency Intelligence:** Instant extraction of insights from complex documents and audio.
- **360° Jurisdiction Pulse:** Real-time tracking of complaints, projects, and stakeholders.
- **AI-Native Workflow:** A legislative copilot that "reasons" across your specific administrative context.

---

## 🚀 Key Feature Matrix (Exhaustive)

| Module | Eye-Catching Features | Technical Implementation |
| :--- | :--- | :--- |
| **Leader Dashboard** | Dynamic time-aware greetings, mission-critical stats, real-time activity feed, and upcoming event highlights. | **Firestore Real-time Listeners** + Dynamic JS Stats Engine. |
| **Constituency Tracker** | End-to-end grievance management, ward-wise health monitoring, and community stakeholder directory. | Relational Firestore architecture with modular CRUD sub-pages. |
| **AI Assistant** | Context-aware reasoning; answers questions about your specific complaints, projects, and meetings. | **Groq Llama 3.3-70B** with RAG-lite system prompts. |
| **Document Brain** | Turbo-charged summarization of PDF, DOCX, and TXT; interactive "Ask AI" for deep-dive analysis. | `pdfjs-dist` + `mammoth` + Recursive AI Summarization. |
| **Meeting Intelligence** | Real-time audio recording, auto-transcription, and automated Action-Item/Decision extraction. | **Whisper-Large-V3-Turbo** + Semantic Llama Analysis. |
| **AI Speechwriter** | Multi-tone editor for Speeches, Press Statements, and Official Letters in local/global voices. | **Llama 3.1-8B** logic + `react-quill-new` rich text editor. |
| **Schedule Optimizer** | Advanced calendar views (Month, Week, Agenda) with high-priority categorized events. | Native Notifications (Web Push API) + Firebase Persistence. |

---

## 🛠️ Technical Architecture

### **1. The "Zinc" Frontend Stack**
- **Framework:** React 18 + Vite (Sub-second HMR for rapid development).
- **Design System:** Custom "Zinc/Slate" aesthetic using **Tailwind CSS**.
- **Aesthetics:** High-fidelity glassmorphism, precise micro-animations, and full **Theme-Awareness** (Light/Dark mode).
- **Interactions:** Responsive layouts optimized for both field-tablet use and desktop command centers.

### **2. The Intelligence Layer (AI)**
- **Inference Engine:** **Groq Cloud** (Industry-leading tokens/sec for sub-second responses).
- **Model Orchestration:**
  - **Llama 3.3-70B Versatile:** Primary brain for complex reasoning and document analysis.
  - **Llama 3.1-8B Instant:** Specialized for lightweight drafting and fast interactions.
  - **Whisper-Large-V3-Turbo:** High-accuracy, low-latency speech-to-text.
- **Context Injection:** Dynamic workspace snapshots (current complaints, recent meetings) are injected into system prompts for "hallucination-free" grounding.

### **3. The Backend Infrastructure**
- **Unified Auth:** **Firebase Authentication** with multi-channel login (Email/OTP ready).
- **Real-time Database:** **Google Cloud Firestore** for NoSQL scalability and instant state synchronization across devices.
- **Storage:** Secure processing of documents (>50MB support) and long-form meeting audio chunks.

---

## 📦 Deep-Dive: Implementation Details

### **1. AI Meeting Intelligence (`/meetings`)**
- **Recording:** Leverages the `MediaRecorder API` with auto-flushing chunks to prevent data loss.
- **Analysis:** Automatically extracts:
  - **Summary:** Concise narrative of the proceedings.
  - **Action Items:** Precise "Who/What/When" checklist.
  - **Decisions:** Documented final verdicts to prevent future ambiguity.
  - **Attendees:** Automatically identified participants from transcript context.

### **2. Document Intelligence (`/documents`)**
- **Parsing:** Professional-grade text extraction using `pdfjs-dist` (for complex PDFs) and `mammoth` (for legacy DOCX).
- **Iterative Q&A:** Users can "chat" with their documents, leveraging a 128k context window to find obscure clauses or budget figures instantly.

### **3. Legislative Speechwriter (`/speeches`)**
- **Tone Control:** Toggle between *Formal, Inspirational, Assertive,* or *Empathetic* voices.
- **Modular Drafting:** Specifically tuned prompts for regional press statements versus formal legislative letters.
- **Rich Interaction:** Integrated suite with `ReactQuill` for manual refinement of AI-generated drafts.

### **4. Constituency Command (`/constituency`)**
- **Grievance Pipeline:** Tracking complaints from entry to resolution with category-based analytics.
- **Ward Health:** High-level overview of infrastructure projects and scheme implementation at the localized level.

---

## 🔒 Security & Data Sovereignty

- **Verified Access:** Domain-restricted authentication for authenticated government personnel.
- **Data Isolation:** Enterprise-grade multi-tenancy at the Firestore document level.
- **Privacy Assurance:** Workspace data is **strictly used for inference context** and is **never** used to train public AI models.
- **Cloud Compliance:** Hosted on Google Cloud Platform (GCP) ensuring 99.9% uptime and global security standards.

---

## 🚀 Getting Started

### **Environment Configuration**
Create a `.env` in the root directory:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_GROQ_API_KEY=your_groq_key
```

### **Local Deployment**
```bash
# Clone
git clone https://github.com/dear-asutosh/neeti-ai.git

# Install
npm install

# Launch
npm run dev
```

---

**Neeti AI** | Built with precision for the leaders of New India. 🇮🇳