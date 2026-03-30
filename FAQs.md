# Hackathon Judge FAQs: Neeti AI

Here are 5 critical questions judges might ask about your project, along with strong, convincing answers you can use during your pitch.

### 1. Data Privacy & Security
**Q: Government data is highly sensitive. How exactly are you ensuring that confidential citizen data or internal meetings aren’t being used to train AI models?**

**A:** Data sovereignty is a core pillar of Neeti AI. We specifically engineered the system to use commercial API interfaces (like Groq) where model training on user prompts is strictly disabled by default. Furthermore, all user data, complaints, and documents are securely isolated in Google Cloud Firestore with strict document-level security rules. The AI only receives context temporarily during inference (using RAG) and never retains the government data post-query.

---

### 2. AI Hallucination & Accuracy
**Q: LLMs are known to hallucinate. If an official uses the "Document Intelligence" feature to query a 100-page policy, how do you guarantee the AI doesn't fabricate a clause or budget figure?**

**A:** We solve this using a strict Retrieval-Augmented Generation (RAG) approach. When a user asks a question, the system searches the specific extracted text (via `pdfjs`/`mammoth`) and injects only the most relevant paragraphs into the Llama 3.3-70B prompt. We explicitly instruct the model to answer *only* using the provided context and to state "Information not found" if it isn't in the document. The AI acts as a search-and-summarize tool, not an independent knowledge oracle.

---

### 3. Architecture & Speed
**Q: Why did you choose Groq Cloud and local/open-source models like Llama 3.3 over something more common like OpenAI’s GPT-4?**

**A:** We chose Groq and Llama for two reasons: **Latency** and **Future-Proofing**. Groq provides industry-leading Tokens-Per-Second, which is critical for a "real-time" command center where officials need instant answers. Secondly, by building our prompts and architecture around open-weights models like Llama and Whisper, we ensure that if a government client requires 100% on-premise air-gapped hosting in the future, our OS can be easily migrated to run on their local secure servers.

---

### 4. Technical Feasibility
**Q: How are you handling the processing of large 50MB documents or long multi-hour audio files without crashing the browser or timing out the frontend?**

**A:** We handle heavy processing asynchronously. For audio, our Meeting Intelligence module leverages the `MediaRecorder API` to chunk the audio periodically and flush it. For document parsing, instead of sending a massive 50MB PDF directly to an LLM, we use `pdfjs-dist` to extract the text on the client/edge side first, and then we chunk the text logically. This keeps network payloads extremely small and prevents the frontend from freezing.

---

### 5. Real-World Adoption
**Q: Bureaucracy is notoriously slow to adopt new technology. Why would a public official switch to your dashboard instead of relying on their current assistants and WhatsApp?**

**A:** We designed Neeti AI not to replace their workflow, but to enhance it invisibly. Officials don't need to learn a complex CRM. They simply speak into the Meeting Intelligence module or read the auto-summarized Daily Briefing on their dashboard. By saving them hours of reading 100-page circulars and manually tracking grievances, Neeti AI acts as a "Strategic Force Multiplier" that gives them their time back for actual decision-making.
