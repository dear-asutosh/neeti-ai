# Neeti AI FAQs

## 1. Why did the team choose the name "Neeti AI" for this platform, what does 'Neeti' represent in Indian context, and what is its core mission when it comes to supporting public representatives and elected officials in their daily governance work?

Answer: Neeti means policy, morality, and wise decision-making in Indian traditions. It helps leaders automate admin tasks like paperwork to focus on citizen engagement.

## 2. In choosing the database for Neeti AI, why opt for Google Cloud Firestore over more traditional options like SQL databases or something specialized for time-based data?

Answer: Firestore provides real-time updates across devices, so new complaints or changes appear instantly on dashboards without manual refresh.

## 3. Many people wonder if Neeti AI is simply a basic interface or wrapper around general tools like ChatGPT - does it offer its own unique intelligence tailored specifically to administrative workflows?

Answer: No, it integrates your personal data like projects and meetings into AI responses for context-specific advice, not generic replies.

## 4. Can you list the key large language models (LLMs) that drive the reasoning capabilities in Neeti AI and explain the rationale behind selecting each one for different types of tasks?

Answer: Llama 3.3-70B handles complex analysis, Llama 3.1-8B quick drafts, Whisper for multilingual speech - all accelerated by Groq for speed.

## 5. What exactly does the Groq Inference Engine do within the Neeti AI system, and how does its inclusion improve the day-to-day user experience for busy officials?

Answer: Groq makes AI responses nearly instant, turning long waits into quick summaries or drafts during meetings.

## 6. Given limitations like token rates on free tiers, how exactly does Neeti AI process and manage very large documents such as lengthy government circulars or reports?

Answer: It splits documents into chunks, summarizes each, then combines - ensuring full coverage without hitting limits.

## 7. For teams concerned about data security in government work, what concrete technical evidence can you provide to prove that no sensitive information is stored on any unverified or private developer servers?

Answer: Data flows directly to Google Cloud via HTTPS; browser network tab shows only official Google endpoints like firestore.googleapis.com.

## 8. When user data is transmitted to external AI services like Groq or Llama models as part of processing queries, is there any retention of that data afterward or use in training public models?

Answer: Data is processed temporarily for the response only and deleted immediately under zero-retention policies - never used for training.

## 9. Given options for local deployment, why does Neeti AI favor a cloud-based architecture for deployment among government officials working in various field conditions?

Answer: Advanced AI requires server-grade hardware unavailable on laptops; cloud delivers power securely from any device.

## 10. In cases where Neeti AI had difficulty accurately totaling or filtering a large list like 200 political candidates during processing, what was the root cause and what practical workaround do you recommend?

Answer: AI excels at text insights but not always precise math on huge datasets. Export to Excel for calculations, upload results back for AI analysis.

## 11. Beyond English, does Neeti AI properly support India's diverse regional languages for features like speech transcription and generation of reports or communications?

Answer: Yes, supports 12+ languages including Hindi, Tamil, Bengali; transcribes regional speech and translates as needed.

## 12. During busy review meetings with multiple stakeholders, how does the Meeting Intelligence feature systematically identify and capture all critical action items to prevent oversights?

Answer: It scans transcripts for commitments (who, what, when) and auto-lists them on your dashboard for follow-up.

## 13. Compared to simple template fillers used in offices, in what ways does the AI Speechwriter module in Neeti AI generate more effective and personalized content?

Answer: It crafts original text tuned to event type and audience tone, adapting to your voice beyond basic placeholders.

## 14. When comparing Neeti AI to standalone premium subscriptions like ChatGPT or Gemini Advanced, what unique advantages make it the better choice for administrative leadership roles?

Answer: It connects directly to your constituency data, schedule, and history for personalized, up-to-date guidance.

## 15. What built-in mechanisms does Neeti AI have as a fail-safe for users who might lose internet connectivity while working in remote or rural constituency areas?

Answer: Cached recent data and drafts remain accessible offline, auto-syncing upon reconnection.

## 16. If an administrator or developer makes updates to core configurations such as security rules or feature toggles, how quickly are those changes reflected across all users' interfaces?

Answer: Changes propagate in seconds via real-time Firebase and Vite's fast reload system.

## 17. What exactly is the Leader Dashboard in Neeti AI, and what kinds of information and widgets does it display to give officials an at-a-glance view of their priorities?

Answer: Home screen with time-based greetings, stats on complaints/projects, activity feed, events - all live-updating.

## 18. Walk through how the Constituency Tracker handles complaint management - from filing a new one to viewing status and analytics.

Answer: File details, view categorized lists, drill into resolved/open with search and reports.

## 19. Beyond complaints, how does the system allow management of people directories, ongoing projects, and ward-level overviews in the Constituency Tracker section?

Answer: People: Add/view profiles; Projects: Status tracking/details; Wards: Area summaries and deep dives.

## 20. In practical terms, how do users interact with the AI Assistant feature to get help on specific data like pending tasks or document insights?

Answer: Type natural questions like "Ward 5 issues?" or upload files - it grounds answers in your workspace.

## 21. For quick local testing or demos, what are the step-by-step instructions to set up and launch Neeti AI on a development machine?

Answer: Add Firebase/Groq keys to .env, run npm install && npm run dev; easy Vercel deploy.

## 22. Who precisely is the target user for Neeti AI - what roles and responsibilities make it indispensable in their workflow?

Answer: MLAs, councillors, officials handling constituency services, grievances, and public engagement.

## 23. When preparing for investor pitches, jury evaluations, or team demos, what standout benefits and demo flows from Neeti AI should be highlighted?

Answer: Real-time updates, AI summaries, secure setup; demo complaint filing to instant dashboard + doc analysis.

## 24. What are the most frequent troubleshooting steps for common issues like AI not responding or data sync problems?

Answer: Verify API keys, mic permissions for meetings, Firebase rules for sync.

## 25. Specifically for high-stakes jury or presentation prep, how can internal teams leverage these FAQs and the product itself to confidently field technical and use-case questions?

Answer: Review questions/answers here, run live demos on core flows like AI queries/dashboard to build familiarity.
