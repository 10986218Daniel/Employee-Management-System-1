# Employee Management System

A comprehensive employee management system with real-time attendance tracking, built with React, TypeScript, and Supabase.

## Features

- **Real-time Attendance Tracking**: Live updates when employees clock in/out
- **HR Dashboard**: Comprehensive view of all employee attendance with real-time status
- **Employee Self-Service**: Clock in/out functionality with location tracking
- **Role-based Access**: Different dashboards for HR, Admin, and Employee roles
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Export Functionality**: PDF and Excel export for attendance reports

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase Client** for real-time data

### Backend
- **Express.js** API server
- **Supabase** for database and real-time subscriptions
- **PostgreSQL** database with real-time capabilities

### Database
- **Supabase PostgreSQL** with real-time subscriptions
- **Row Level Security (RLS)** for data protection
- **Real-time triggers** for live updates

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd Employee-Management-System-main
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/` to set up the database
   - Get your Supabase URL and anon key

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local` (create if it doesn't exist)
   - Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development servers**
```bash
# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2)
cd server
npm start
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:10000

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Configure build command: `cd server && npm install`
4. Configure start command: `cd server && npm start`

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # Dashboard pages
│   │       ├── admin/      # Admin-specific pages
│   │       ├── employee/   # Employee-specific pages
│   │       └── hr/         # HR-specific pages
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── server/                 # Express.js backend
├── supabase/              # Database migrations and config
└── public/                # Static assets
```

## Key Features Implementation

### Real-time Attendance Tracking
- Uses Supabase real-time subscriptions to listen for database changes
- Automatically updates UI when employees clock in/out
- Shows live status indicators and working hours

### HR Dashboard
- Displays all employees with their current attendance status
- Real-time updates without page refresh
- Export functionality for attendance reports
- Comprehensive attendance overview

### Employee Self-Service
- Clock in/out with location tracking
- View personal attendance history
- Real-time status updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
