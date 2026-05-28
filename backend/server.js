require('dotenv').config();
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const db = require('./database');
const pendingVerifications = new Map();
const pendingPasswordResets = new Map();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const upload = multer({ dest: 'uploads/' });

// --- MOCK DATABASE ---
const users = []; // { id, email, password, role, isVerified, verificationCode }
let currentSession = {
  isActive: false,
  topic: '',
  files: [],
  sessionCode: null,
  teacherName: '',
  sessionAnalytics: []
};

// --- EMAIL SETUP ---
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Real Email Provider Configured.');
} else {
  // Fallback to Ethereal (Fake Email) for testing if .env is not set up
  nodemailer.createTestAccount((err, account) => {
    if (err) return console.error('Failed to create a testing account. ' + err.message);
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
    console.log('Test Email Provider Configured (Ethereal). Emails will be logged in console.');
  });
}

const sendEmail = async (to, subject, text) => {
  if (!transporter) return;
  try {
    const info = await transporter.sendMail({
      from: '"Classroom Bot" <noreply@classroom.com>',
      to, subject, text
    });
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log('Preview test email:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

// --- AUTH ROUTES ---
app.post('/register', async (req, res) => {
  const { name, email, password, role, teacherSecret } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    if (role === 'teacher' && teacherSecret !== process.env.TEACHER_SECRET) {
      return res.status(401).json({ error: 'Invalid Teacher Secret Code' });
    }
    
    await db.registerUser(name, email, password, role);
    
    res.json({ message: 'Registration successful. You can now login!' });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/verify-email', async (req, res) => {
  res.json({ message: 'Email verified successfully!' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await db.checkPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, role: user.role, email: user.email, name: user.name, points: user.points });
  } catch(e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'No account found with this email' });

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    pendingPasswordResets.set(email, resetCode);

    await sendEmail(email, 'Password Reset Code', `Your password reset code is: ${resetCode}`);
    
    res.json({ message: 'Reset code sent to your email.' });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  if (pendingPasswordResets.get(email) !== code) {
    return res.status(400).json({ error: 'Invalid or expired reset code' });
  }

  try {
    await db.updatePassword(email, newPassword);
    pendingPasswordResets.delete(email);
    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- LEADERBOARD ROUTE ---
app.get('/students', async (req, res) => {
  try {
    const allUsers = await db.getAllUsers();
    const students = allUsers.filter(u => u.role === 'student' && u.isVerified);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- PROFILE ROUTE ---
app.post('/update-profile', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    await db.updateName(email, name);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- SESSION ROUTES ---
app.post('/session/start', async (req, res) => {
  const { topic, teacherName } = req.body;
  currentSession.isActive = true;
  currentSession.topic = topic || 'General Lecture';
  currentSession.teacherName = teacherName || 'Teacher';
  currentSession.sessionCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit session code
  currentSession.files = [];
  currentSession.sessionAnalytics = [];

  // Email all students
  try {
    const allUsers = await db.getAllUsers();
    const students = allUsers.filter(u => u.role === 'student' && u.isVerified);
    for (const student of students) {
      sendEmail(
        student.email, 
        'Class is starting soon!', 
        `The teacher just started a live session on "${currentSession.topic}". Join using the code: ${currentSession.sessionCode}`
      ).catch(err => console.error("Session start notification email failed:", err));
    }
  } catch(e) {
    console.error("Failed to email students", e);
  }

  io.emit('session_status_changed', currentSession);
  res.json(currentSession);
});

app.post('/session/invite', async (req, res) => {
  const { email, sessionCode, teacherName, topic } = req.body;
  if (!email || !sessionCode) return res.status(400).json({ error: 'Missing fields' });

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/student?sessionCode=${sessionCode}`;
    await sendEmail(
      email, 
      'You are invited to a live class!', 
      `Prof. ${teacherName} has invited you to a live session on "${topic}".\n\nJoin directly using this link:\n${inviteLink}\n\nOr enter code: ${sessionCode}`
    );
    res.json({ message: 'Invite sent!' });
  } catch(e) {
    console.error("Invite error:", e);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

app.post('/session/join', (req, res) => {
  const { sessionCode } = req.body;
  if (!currentSession.isActive) return res.status(400).json({ error: 'No active session.' });
  if (sessionCode !== currentSession.sessionCode) return res.status(403).json({ error: 'Invalid Session Code.' });
  
  res.json({ message: 'Joined session successfully', session: currentSession });
});

app.post('/session/stop', (req, res) => {
  currentSession.isActive = false;
  currentSession.sessionCode = null;
  io.emit('session_status_changed', currentSession);
  res.json(currentSession);
});

app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files) return res.status(400).json({ error: 'No files received' });
  req.files.forEach(file => {
    currentSession.files.push({ originalName: file.originalname, filename: file.filename, uploadedAt: new Date() });
  });
  io.emit('files_updated', currentSession.files);
  res.json({ message: 'Files uploaded', files: currentSession.files });
});

// --- AI Logic using Gemini ---
const extractPdfParts = (files) => {
  const parts = [];
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'uploads', file.filename);
      if (fs.existsSync(filePath)) {
        const dataBuffer = fs.readFileSync(filePath);
        parts.push({
          inlineData: {
            data: dataBuffer.toString("base64"),
            mimeType: "application/pdf"
          }
        });
      }
    } catch (err) {
      console.error(`Failed to read PDF ${file.originalName}:`, err);
    }
  }
  return parts;
};

const generateWithFallback = async (pdfParts, promptText) => {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-latest"
  ];
  
  let lastError;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([promptText, ...pdfParts]);
      return result;
    } catch (error) {
      lastError = error;
      // If it's a rate limit (429), try the next model
      if (error.status === 429) {
        console.warn(`[WARNING] Rate limit hit for ${modelName}. Falling back to next model...`);
        continue;
      }
      // If it's a 503 Service Unavailable, also try the next model
      if (error.status === 503) {
         console.warn(`[WARNING] ${modelName} is overloaded (503). Falling back...`);
         continue;
      }
      // Otherwise, throw immediately (e.g. 400 Bad Request)
      throw error;
    }
  }
  // If ALL models failed, throw the last error
  throw lastError;
};

const getAiResponse = async (question, topic, files) => {
  try {
    const pdfParts = extractPdfParts(files);
    
    const prompt = `
You are a helpful AI classroom assistant.
The current session topic is: "${topic}".

A student has asked the following question: "${question}"

Instructions:
1. Please answer the student's question clearly and concisely.
2. Rely mostly (90%) on the attached documents.
3. If the document content doesn't fully answer the question, use your general knowledge to fill in the gaps.
4. IMPORTANT - You have TWO visual tools available. Choose the right one:
   TOOL A (For graphs, flowcharts, algorithms): Use a Mermaid.js code block.
   \`\`\`mermaid
   graph TD; A-->B;
   \`\`\`
   CRITICAL MERMAID RULES:
   - ALWAYS quote node labels that contain spaces or special characters like parentheses or brackets. Example: A["Relations (Tables)"] --> B["Rows"]
   - Avoid HTML tags in labels.
   TOOL B (For realistic images, art, illustrations): Output EXACTLY this tag: [IMAGE: short description]
   Example: [IMAGE: a futuristic robot teacher in a classroom]
   CRITICAL: The image description MUST be under 10 words and contain NO math symbols.
5. IMPORTANT: You can color your text to match the mood of the answer! Use exactly these markdown headings for colored text:
   - For GREEN text (e.g., correct answers, success, encouragement), start the line with: "#### "
   - For RED text (e.g., incorrect, warnings, critical issues), start the line with: "##### "
   - For BLUE text (e.g., facts, tips, hints), start the line with: "###### "
   Always include a space after the hashes. Do NOT use HTML tags for color.
`;
    
    const result = await generateWithFallback(pdfParts, prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I am having trouble connecting to my AI brain right now.";
  }
};

const getAiQuiz = async (topic, files, difficulty = "Medium") => {
  try {
    const pdfParts = extractPdfParts(files);
    
    const prompt = `
You are a helpful AI classroom assistant.
The current session topic is: "${topic}".

Generate exactly ONE multiple-choice quiz question based on the attached documents or the topic. 
The difficulty level should be: ${difficulty}. 
- Easy: Basic recall of facts.
- Medium: Understanding and applying concepts.
- Hard: Deep analysis, tricky edge cases, or multi-step logic.

The output MUST be valid JSON and exactly match this format:
{
  "question": "The question text goes here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0
}
Note: "correctAnswer" should be the index (0-3) of the correct option in the array.
Do not wrap the JSON in Markdown formatting blocks like \`\`\`json. Return just the raw JSON.
`;
    
    const result = await generateWithFallback(pdfParts, prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.slice(7);
    if (text.startsWith('\`\`\`')) text = text.slice(3);
    if (text.endsWith('\`\`\`')) text = text.slice(0, -3);
    text = text.trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return { question: "Failed to generate quiz.", options: ["A", "B", "C", "D"], correctAnswer: 0 };
  }
};

const getAiSummary = async (topic, files) => {
  try {
    const pdfParts = extractPdfParts(files);
    
    const prompt = `
You are a helpful AI classroom assistant.
The current session topic is: "${topic}".

Please provide a highly engaging, visually attractive summary of the key points from the attached documents.
DO NOT just write boring text. You MUST use the following formatting tools:
1. Start with an encouraging GREEN colored heading using exactly: "#### 🌟 Topic Summary: ${topic}"
2. Create a Mermaid.js diagram (like a mindmap, flowchart, or concept map) to visually represent the core concepts! 
   Use this exact format:
   \`\`\`mermaid
   graph TD;
     A["Core Concept"] --> B["Sub Concept"];
   \`\`\`
   CRITICAL MERMAID RULES:
   - ALWAYS quote node labels that contain spaces or special characters like parentheses or brackets. Example: A["Relations (Tables)"] --> B["Rows"]
   - Avoid HTML tags in labels.
3. Use relevant emojis for your bullet points.
4. Highlight important terms in **bold** and use BLUE text for important facts using exactly: "###### 💡 Key Fact:"
If there are no documents, provide a visually engaging general overview of the topic.
`;
    
    const result = await generateWithFallback(pdfParts, prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Sorry, I am having trouble summarizing the documents right now.";
  }
};

const getAiFlashcards = async (topic, files) => {
  try {
    const pdfParts = extractPdfParts(files);
    
    const prompt = `
You are a helpful AI classroom assistant.
The current session topic is: "${topic}".

Generate 3-5 flashcards covering the most important concepts, terms, or definitions from the attached documents or topic.
IMPORTANT: Use Markdown formatting (e.g., **bold**, - lists) for the front and back text. DO NOT use raw HTML tags like <ul>, <li>, or <b>.
The output MUST be valid JSON and exactly match this format:
[
  { "front": "Concept Name / Question", "back": "Definition / Answer" },
  { "front": "Concept Name / Question", "back": "Definition / Answer" }
]
Do not wrap the JSON in Markdown formatting blocks like \`\`\`json. Return just the raw JSON.
`;
    
    const result = await generateWithFallback(pdfParts, prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.slice(7);
    if (text.startsWith('\`\`\`')) text = text.slice(3);
    if (text.endsWith('\`\`\`')) text = text.slice(0, -3);
    text = text.trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    return [{ front: "Error generating flashcards", back: "Please try again later." }];
  }
};

// Socket.io
io.on('connection', (socket) => {
  socket.emit('session_status_changed', currentSession);
  socket.emit('files_updated', currentSession.files);

  socket.on('student_ask_ai', async (data) => {
    // Add to analytics
    currentSession.sessionAnalytics.push({
      time: new Date().toISOString(),
      question: data.text
    });
    io.emit('analytics_updated', currentSession.sessionAnalytics);

    const response = await getAiResponse(data.text, currentSession.topic, currentSession.files);
    socket.emit('ai_response', { answer: response });
  });

  socket.on('student_request_summary', async () => {
    const response = await getAiSummary(currentSession.topic, currentSession.files);
    socket.emit('ai_response', { answer: response });
  });

  socket.on('student_request_flashcards', async () => {
    const flashcards = await getAiFlashcards(currentSession.topic, currentSession.files);
    socket.emit('flashcards_received', flashcards);
  });

  socket.on('teacher_generate_quiz', async (data) => {
    const difficulty = data?.difficulty || "Medium";
    const quiz = await getAiQuiz(currentSession.topic, currentSession.files, difficulty);
    socket.emit('quiz_generated', quiz);
  });

  socket.on('teacher_push_quiz', (quizData) => {
    io.emit('incoming_quiz', quizData);
  });

  socket.on('student_submit_quiz', async ({ email, points }) => {
    try {
      await db.addPoints(email, points);
      const allUsers = await db.getAllUsers();
      const students = allUsers.filter(u => u.role === 'student' && u.isVerified);
      io.emit('leaderboard_updated', students);
    } catch (err) {
      console.error("Failed to update points:", err);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
