# 🎓 EduFeedback — Course Feedback & Rating System

A full-stack **MERN** application that replaces paper-based course feedback with a modern, secure digital platform.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ ([Download](https://nodejs.org))
- **MongoDB** v6+ running locally, or a MongoDB Atlas URI
- **npm** or **yarn**

---

## 📁 Project Structure

```
survey/
├── server/          # Node.js + Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── seed.js      ← Demo data seeder
│   └── server.js
└── client/          # React frontend
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── services/
```

---

## ⚙️ Installation & Setup

### Step 1 — Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2 — Configure Environment
```bash
# Copy .env.example to .env (already done)
# Edit server/.env if needed:
# MONGO_URI=mongodb://localhost:27017/course_feedback_db
# JWT_SECRET=your_secret_here
# PORT=5000
```

### Step 3 — Seed the Database (optional but recommended)
```bash
cd server
node seed.js
```
This creates:
- 👨‍💼 **Admin**: `admin@college.edu` / `admin123`
- 👨‍🎓 **Student**: `alice@college.edu` / `student123`
- 6 sample courses + feedback entries

### Step 4 — Start the Backend
```bash
cd server
npm run dev
```
Server runs at: `http://localhost:5000`

### Step 5 — Install Frontend Dependencies
```bash
cd client
npm install
```

### Step 6 — Start the Frontend
```bash
cd client
npm start
```
App opens at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new student |
| POST | `/api/auth/login` | Public | Login user |
| GET | `/api/auth/me` | Private | Get current user |
| GET | `/api/courses` | Private | Get all courses |
| POST | `/api/courses` | Admin | Create a course |
| DELETE | `/api/courses/:id` | Admin | Delete a course |
| POST | `/api/feedback` | Student | Submit feedback |
| GET | `/api/feedback` | Private | Get feedbacks |
| GET | `/api/feedback/analytics` | Admin | Get analytics data |
| GET | `/api/feedback/check/:courseId` | Student | Check if submitted |
| DELETE | `/api/feedback/:id` | Admin | Delete feedback |

---

## ✨ Features

### 👨‍🎓 Student
- Register & Login with JWT
- Browse all courses with real-time search
- Submit feedback (rating 1-5 stars)
- Detailed ratings: Teaching Quality, Course Content, Satisfaction
- **Anonymous feedback** toggle
- Duplicate submission prevention
- See own submitted feedback with ratings

### 👨‍💼 Admin
- Analytics dashboard with 3 Chart.js charts
  - Rating distribution (bar chart)
  - Average rating per course (horizontal bar)
  - Feedback trend over 30 days (line chart)
- View & delete all feedback
- Filter feedback by course
- Paginated feedback table
- Create & delete courses (with modal form)
- Course analytics table

---

## 🔐 Security
- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens with 7-day expiry
- Role-based middleware (admin vs student)
- Input validation via **express-validator**
- Duplicate feedback prevented at DB level (compound index) and API level
- Admin role cannot be self-assigned at registration

---

## 🧪 Testing with Postman

1. Register/Login → copy the `token` from response
2. Add header: `Authorization: Bearer <token>`
3. Test all endpoints

**Edge cases handled:**
- ✅ Duplicate submission returns 400
- ✅ Invalid/expired token returns 401
- ✅ Missing required fields validated server-side
- ✅ Non-admin accessing admin routes returns 403

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router Dom v6 |
| Styling | Custom CSS (Dark Mode, Glassmorphism) |
| Charts | Chart.js + react-chartjs-2 |
| Notifications | react-hot-toast |
| HTTP Client | Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |

---

## 🎨 UI Highlights
- 🌙 Dark mode with custom CSS design system
- ✨ Glassmorphism navbar
- 🎆 Animated star rating component
- 📊 Beautiful analytics charts
- 🔔 Toast notifications
- 📱 Fully responsive

---

*Built with ❤️ as a Final Year MERN Stack Project*

Developed by A.Yashaswini (B23CN111)
Under supervision of BRIKIENLABS ([brikienlabs.tech](https://brikienlabs.tech))
