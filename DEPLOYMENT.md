# Deployment Guide

This guide will help you deploy the Employee Management System to production using Vercel (frontend) and Render (backend).

## Prerequisites

1. GitHub account
2. Vercel account
3. Render account
4. Supabase project

## Step 1: Push to GitHub

### Create a new repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "employee-management-system")
5. Make it public or private (your choice)
6. Don't initialize with README (we already have one)
7. Click "Create repository"

### Push your code to GitHub

```bash
# Add the remote origin (replace with your GitHub repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (or set to root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

## Step 3: Deploy Backend to Render

1. Go to [Render](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: employee-management-api
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: Free tier (or upgrade as needed)
5. Add environment variables:
   - `PORT`: 10000
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: Your Vercel frontend URL
6. Click "Create Web Service"

## Step 4: Update Frontend Configuration

After deploying the backend, update your frontend environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add or update:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://your-app-name.onrender.com`)

## Step 5: Update Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Update the Site URL to your Vercel frontend URL
4. Add your Vercel domain to the allowed origins

## Step 6: Test the Deployment

1. Visit your Vercel frontend URL
2. Test the login functionality
3. Test the real-time attendance features
4. Verify that the HR dashboard shows real-time updates

## Environment Variables Reference

### Frontend (Vercel)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_render_backend_url
```

### Backend (Render)
```
PORT=10000
NODE_ENV=production
CORS_ORIGIN=your_vercel_frontend_url
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Render backend has the correct CORS_ORIGIN set to your Vercel URL
2. **Supabase Connection**: Verify your Supabase URL and anon key are correct
3. **Real-time Not Working**: Check that Supabase real-time is enabled and RLS policies are set correctly
4. **Build Failures**: Check the build logs in Vercel/Render for specific error messages

### Debugging Steps

1. Check browser console for errors
2. Check Vercel function logs
3. Check Render service logs
4. Verify all environment variables are set correctly
5. Test API endpoints directly

## Monitoring

- **Vercel**: Monitor frontend performance and errors
- **Render**: Monitor backend uptime and logs
- **Supabase**: Monitor database performance and real-time connections

## Scaling

- **Frontend**: Vercel automatically scales with traffic
- **Backend**: Upgrade Render plan for better performance
- **Database**: Supabase scales automatically with usage

## Security Considerations

1. Enable Row Level Security (RLS) in Supabase
2. Set up proper authentication policies
3. Use environment variables for sensitive data
4. Regularly update dependencies
5. Monitor for security vulnerabilities
