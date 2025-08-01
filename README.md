# 📦 Inventory Management System

## ✨ What This System Does

### 🎯 **Core Purpose**
This inventory management system helps businesses:
- **Track inventory in real-time** across multiple warehouses
- **Automatically generate alerts** when stock runs low
- **Create purchase orders** with a single click
- **Monitor stock movements** with complete audit trails
- **Generate comprehensive reports** for business insights
- **Manage suppliers and warehouse locations** efficiently

## 🛠 Technology Stack

- **Frontend**: [Astro](https://astro.build/) + React components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom theming
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Real-time Updates**: Supabase Realtime
- **Authentication**: Supabase Auth
- **Language**: TypeScript for type safety

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- A **Supabase account** - [Sign up for free](https://supabase.com/)
- **Git** installed on your machine
- A code editor like **VS Code** (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Jardiv/Inventory-Management.git
cd Inventory-Management
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all the necessary packages including Astro, React, Tailwind CSS, and the Supabase client.

### Step 3: Supabase Database Setup

#### 3.1 Create Your Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com/)
   - Click "Start your project" or "Sign in" if you have an account
   - Click "New Project"

2. **Project Configuration**
   - Choose your organization (or create one)
   - Enter a **Project Name** (e.g., "Inventory Management")
   - Set a **Database Password** (save this securely!)
   - Choose your **Region** (closest to your users)
   - Click "Create new project"

3. **Wait for Setup**
   - Supabase will create your PostgreSQL database
   - This usually takes 1-2 minutes
   - You'll see a progress indicator

#### 3.2 Get Your Project Credentials

1. **Navigate to Project Settings**
   - In your Supabase dashboard, click "Settings" (gear icon)
   - Go to "API" section

2. **Copy Your Credentials**
   - Copy your **Project URL** (looks like: `https://xyz.supabase.co`)
   - Copy your **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

#### 3.3 Configure Environment Variables

1. **Create Environment File**
   In your project root directory, create a file named `.env`:
   
   ```bash
   # Create the .env file
   touch .env
   ```

2. **Add Your Supabase Credentials**
   Open the `.env` file and add:
   
   ```env
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   **Important**: Replace the example values with your actual Supabase credentials!

#### 3.4 Database Schema Setup

Your Supabase database needs the following tables for the inventory system to work properly:

**Core Tables:**
- `products` - Stores product catalog (codes, names, descriptions, categories)
- `inventory` - Tracks stock levels, minimum quantities, warehouse locations
- `transactions` - Records all stock movements (in/out operations)
- `suppliers` - Manages supplier contact information
- `purchase_orders` - Handles automated purchase order generation
- `warehouses` - Manages multiple warehouse locations

**Setting Up Tables:**
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. You can create tables manually or import a SQL schema file
4. The application will automatically connect to these tables

### Step 4: Run the Application

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Open Your Browser**
   - Navigate to `http://localhost:4321`
   - You should see the inventory management dashboard

3. **Verify Connection**
   - If everything is set up correctly, you'll see the dashboard load
   - Check the browser console for any connection errors
   - The system should display "0" values initially (empty database)

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm install` | Install/update all dependencies |

## 📁 Project Structure Overview

```
Inventory-Management/
├── src/
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── inventory/       # Product management
│   │   ├── reports/         # Analytics & reports
│   │   └── transactions/    # Stock operations
│   ├── pages/              # Astro pages & API routes
│   │   ├── api/            # Backend API endpoints
│   │   ├── inventory/      # Inventory management pages
│   │   ├── reports/        # Reporting pages
│   │   └── stockTransaction/ # Transaction pages
│   ├── layouts/            # Page layouts
│   ├── styles/             # Global CSS & themes
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── package.json           # Project configuration
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.