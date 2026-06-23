# PlinthHQ 🏗️

PlinthHQ (formerly SiteLog) is a comprehensive, modern construction management platform designed to streamline daily operations, track budgets, and enhance team collaboration across construction sites. 

Built with a stunning, high-performance web interface, PlinthHQ brings real-time visibility to owners, project managers, and site engineers.

## ✨ Key Features

- **🛡️ Role-Based Access Control (RBAC):** Custom permissions tailored for Owners, Admins, Project Managers, Site Engineers, Accounts, and Contractors.
- **📝 Daily Site Logs:** Effortlessly record weather conditions, labor counts, equipment usage, materials, and daily activities with photo evidence.
- **🗣️ Voice Dictation & Smart Logging:** Speak your site updates directly into the app from the job site for faster, hands-free record keeping.
- **🌐 Real-Time Translation:** Communicate seamlessly across regional languages with integrated translation for English, Hindi, and Gujarati.
- **💬 Project-Wise Encrypted Chat:** Dedicated real-time communication channels for each project with typing indicators, photo sharing, and online status.
- **💰 Budget & Expense Tracking:** Monitor project budgets in real-time. Track expenses, vendor payments, and generate financial insights.
- **👥 Team & Vendor Management:** Add team members via secure invite links. Maintain a centralized directory of suppliers and contractors.
- **📦 Materials & Equipment:** Comprehensive tracking for inventory, material transfers, and equipment maintenance.
- **🚧 Issue Tracking:** Report, assign, and resolve site issues seamlessly. Restricted editing ensures that assignees can update the status and upload photos without altering core issue details.
- **🔔 Real-Time Notifications:** In-app notifications for task assignments, team invitations, and critical project updates.
- **🌐 Shared Owner Dashboards:** Generate secure, view-only links for external stakeholders and owners to track high-level progress.
- **✨ Premium UI & UX:** Beautiful liquid-glass design system with smooth theme transitions, animated skeleton loaders, and interactive charts.

## 🛠️ Tech Stack

**Frontend (Client)**
- **Framework:** React.js (Vite)
- **Styling:** TailwindCSS, Lucide React (Icons)
- **State Management:** React Context API
- **Routing:** React Router DOM

**Backend (Server)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **File Uploads:** Cloudinary API

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18+)
- MongoDB instance (Local or Atlas)
- Cloudinary Account (for photo uploads)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/plinthhq.git
cd plinthhq
```

### 2. Backend Setup
```bash
cd sitelog-server
npm install
```

Create a `.env` file in the `sitelog-server` directory and add your variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd sitelog-client
npm install
```

Create a `.env` file in the `sitelog-client` directory:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the frontend development server:
```bash
npm run dev
```

## 🔐 User Roles & Permissions

- **Owner:** Executive view. Can see everything, manage billing, and invite high-level managers.
- **Project Manager (PM) / Admin:** Full control over assigned projects, budgets, and team members.
- **Accounts:** Access to budgets, expenses, and vendor management.
- **Site Engineer:** Can view project details, submit daily logs, and update inventory.
- **Contractor:** Restricted access. Can only view specific assigned projects, update their assigned issues, and submit logs.

## 🤝 Contributing

Contributions are welcome! If you'd like to improve PlinthHQ:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
