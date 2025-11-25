# 🎯 Sankalp - 100 Days Commitment Platform

<div align="center">

![Sankalp Logo](./assets/logo.png)

**Transform your life through accountability and commitment**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://sankalp-app.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/SunilBaghel002/Sankalp?style=for-the-badge)](https://github.com/SunilBaghel002/Sankalp/stargazers)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Sankalp** (संकल्प - meaning "Resolution" in Hindi) is a habit-tracking platform that uses financial accountability to help users build lasting habits. Users commit to following **5 daily habits for 100 consecutive days** with a ₹500 stake. Complete the challenge and keep your money. Fail, and the platform keeps it as a consequence of breaking your commitment.

> *"Put your money where your habits are."*

---

## ✨ Features

### Core Features
- 🔐 **Secure Authentication** - Google OAuth integration for seamless sign-in
- 💰 **Financial Commitment** - ₹500 stake to ensure accountability
- 📊 **Daily Habit Tracking** - Track 5 customizable habits every day
- 📈 **Progress Dashboard** - Visual representation of your 100-day journey
- 🔥 **Streak Counter** - Monitor your consecutive days of success
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

### Additional Features
- ⏰ Daily reminders and notifications
- 📅 Calendar view of habit completion
- 🏆 Achievement badges and milestones
- 📊 Analytics and insights
- 👥 Community leaderboard

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|----------|------------|
| **Frontend** | ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white) |
| **Backend** | ![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white) |
| **Database** | ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white) |
| **Authentication** | ![Google OAuth](https://img.shields.io/badge/Google-OAuth_2.0-4285F4?logo=google&logoColor=white) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/Railway-Backend-0B0D0E?logo=railway&logoColor=white) |

</div>

---

## 📁 Project Structure

```
Sankalp/
├── frontend/                # React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service functions
│   │   ├── context/         # React context providers
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/
│   └── package.json
│
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── core/            # Core configurations
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── requirements.txt
│   └── main.py
│
├── docs/                    # Documentation
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Supabase account
- Google Cloud Console project (for OAuth)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/SunilBaghel002/Sankalp.git
cd Sankalp
```

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your environment variables
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

### 3️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Add your environment variables
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_service_key
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# SECRET_KEY=your_jwt_secret_key

# Start the server
uvicorn main:app --reload
```

### 4️⃣ Database Setup (Supabase)

```sql
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commitments table
CREATE TABLE commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) DEFAULT 500.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habits table
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, date)
);
```

---

## 🔌 API Documentation

### Base URL

Development: http://localhost:8000/api/v1
Production: https://api.sankalp-app.com/api/v1


### Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/google` | Google OAuth login |
| `POST` | `/auth/logout` | Logout user |
| `GET` | `/auth/me` | Get current user |

#### Commitments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/commitments` | Create new commitment |
| `GET` | `/commitments` | Get user's commitments |
| `GET` | `/commitments/:id` | Get commitment by ID |
| `PUT` | `/commitments/:id` | Update commitment status |

#### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/habits` | Create new habit |
| `GET` | `/habits` | Get all habits for commitment |
| `PUT` | `/habits/:id` | Update habit |
| `DELETE` | `/habits/:id` | Delete habit |

#### Habit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/habits/:id/log` | Log habit completion |
| `GET` | `/habits/:id/logs` | Get habit logs |
| `GET` | `/commitments/:id/progress` | Get overall progress |

### Example Request

```bash
# Create a new commitment
curl -X POST https://api.sankalp-app.com/api/v1/commitments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "habits": [
      {"name": "Exercise", "description": "30 minutes workout"},
      {"name": "Reading", "description": "Read 20 pages"},
      {"name": "Meditation", "description": "10 minutes meditation"},
      {"name": "Coding", "description": "1 hour of coding"},
      {"name": "No Social Media", "description": "Avoid social media"}
    ],
    "amount": 500
  }'
```

---

## 📱 Screenshots

<div align="center">

| Home Page | Dashboard | Habit Tracker |
|-----------|-----------|---------------|
| ![Home](./assets/screenshots/home.png) | ![Dashboard](./assets/screenshots/dashboard.png) | ![Tracker](./assets/screenshots/tracker.png) |

| Progress View | Profile | Leaderboard |
|---------------|---------|-------------|
| ![Progress](./assets/screenshots/progress.png) | ![Profile](./assets/screenshots/profile.png) | ![Leaderboard](./assets/screenshots/leaderboard.png) |

</div>

---

## 🎮 How It Works


graph LR
    A[Sign Up] --> B[Pay ₹500]
    B --> C[Choose 5 Habits]
    C --> D[Track Daily for 100 Days]
    D --> E{Completed All Days?}
    E -->|Yes| F[🎉 Keep Your Money + Badge]
    E -->|No| G[💸 Forfeit to Platform]


### The Rules

1. **Commitment**: Deposit ₹500 to start your 100-day journey
2. **5 Habits**: Choose exactly 5 habits to track daily
3. **Daily Check-in**: Mark all 5 habits as complete each day
4. **No Breaks**: Missing even one day means forfeiting your deposit
5. **Success**: Complete all 100 days to keep your money and earn rewards

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
   ```bash
   git fork https://github.com/SunilBaghel002/Sankalp.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m "Add: amazing feature"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

### Commit Convention
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Update existing feature
- `Remove:` Remove feature/file
- `Docs:` Documentation changes

---

## 📄 Environment Variables

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

---

## 🛣️ Roadmap

- [x] User authentication with Google OAuth
- [x] Basic habit tracking
- [x] Progress dashboard
- [ ] Payment gateway integration (Razorpay)
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Social features (friends, groups)
- [ ] AI-powered habit recommendations
- [ ] Partial refund system for near-completions

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Sunil Baghel**

[![GitHub](https://img.shields.io/badge/GitHub-SunilBaghel002-181717?style=for-the-badge&logo=github)](https://github.com/SunilBaghel002)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/sunilbaghel002)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/sunilbaghel002)

</div>

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend library
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Supabase](https://supabase.com/) - Database and authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- All contributors and supporters of this project

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ and संकल्प (determination)

</div>
