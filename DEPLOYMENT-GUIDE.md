# 🚀 EcoFlow Water Bottles - Deployment Guide

This guide provides step-by-step instructions for deploying the EcoFlow Water Bottles platform to production environments.

## 📋 **Prerequisites**

- Git repository (GitHub, GitLab, etc.)
- Railway account (recommended) or Heroku account
- MongoDB Atlas account (free tier available)
- Redis Cloud account (free tier available) 
- Netlify account (recommended) or Render account

---

## 🗄 **Database Setup**

### **Step 1: Create MongoDB Atlas Database**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up/login and create a new project
3. Create a new cluster (choose free tier M0)
4. Set up database user credentials
5. Add IP address to whitelist (0.0.0.0/0 for all IPs)
6. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/ecostore?retryWrites=true&w=majority`

### **Step 2: Create Redis Cloud Database**

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up and create a free database
3. Get connection details: `redis://username:password@host:port`

---

## 🖥 **Backend Deployment (Railway)**

### **Step 1: Setup Railway Account**
1. Go to [Railway](https://railway.app/) and sign up
2. Connect your GitHub account
3. Create a new project from GitHub repo

### **Step 2: Configure Environment Variables**
In Railway dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecostore?retryWrites=true&w=majority
REDIS_URL=redis://username:password@host:port
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
SESSION_SECRET=another-super-secret-session-key-different-from-jwt
FRONTEND_URL=https://your-netlify-app.netlify.app
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### **Step 3: Deploy**
1. Railway will automatically detect the project structure
2. Set root directory to `backend` if needed
3. Railway will build and deploy automatically
4. Get your backend URL: `https://your-app.railway.app`

### **Step 4: Seed Database**
Once deployed, run the seed command:
```bash
# Through Railway CLI or dashboard console
npm run seed
```

---

## 🌐 **Frontend Deployment (Netlify)**

### **Step 1: Setup Netlify Account**
1. Go to [Netlify](https://netlify.com/) and sign up
2. Connect your GitHub account
3. Create new site from Git

### **Step 2: Configure Build Settings**
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/.next`

### **Step 3: Environment Variables**
In Netlify dashboard, add these environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app/api
NEXT_PUBLIC_APP_URL=https://your-netlify-app.netlify.app
NEXT_PUBLIC_APP_NAME=EcoFlow Water Bottles
NEXT_PUBLIC_APP_DESCRIPTION=Premium eco-friendly water bottles for sustainable hydration
NEXT_PUBLIC_ENABLE_AB_TESTING=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NODE_ENV=production
```

### **Step 4: Deploy**
1. Netlify will automatically build and deploy
2. Get your frontend URL: `https://your-app.netlify.app`

---

## 🔄 **Update Backend CORS Settings**

After frontend deployment, update the backend environment variable:
```bash
FRONTEND_URL=https://your-netlify-app.netlify.app
```

---

## ✅ **Verification Steps**

### **1. Test Backend Health**
```bash
curl https://your-railway-backend.railway.app/health
```

### **2. Test API Endpoints**
```bash
# Test products endpoint
curl https://your-railway-backend.railway.app/api/products

# Test authentication
curl -X POST https://your-railway-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecowater.com", "password": "Admin123!"}'
```

### **3. Test Frontend**
1. Visit your Netlify URL
2. Navigate to `/products` page
3. Verify images are loading
4. Test real-time features by simulating purchases

### **4. Test Real-time Features**
```bash
# Test WebSocket connection and stock updates
curl -X POST https://your-railway-backend.railway.app/api/products/PRODUCT_ID/purchase \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'
```

---

## 🐛 **Troubleshooting**

### **Backend Issues**
- Check Railway logs in dashboard
- Verify all environment variables are set
- Ensure MongoDB and Redis connections are working
- Check CORS settings if frontend can't connect

### **Frontend Issues**
- Check Netlify build logs
- Verify API URL environment variable
- Test API endpoints directly
- Check browser console for errors

### **Database Issues**
- Verify MongoDB Atlas IP whitelist
- Check database credentials
- Ensure database name matches connection string

---

## 📊 **Performance Monitoring**

### **Backend Monitoring**
- Railway provides built-in metrics
- Access Prometheus metrics at `/metrics` endpoint
- Monitor response times and error rates

### **Frontend Monitoring**
- Netlify provides analytics dashboard
- Monitor Core Web Vitals
- Check build and deployment logs

---

## 🔒 **Security Checklist**

- [x] Environment variables are set and secure
- [x] JWT secrets are strong and unique
- [x] Database credentials are secure
- [x] CORS is properly configured
- [x] Rate limiting is enabled
- [x] HTTPS is enforced
- [x] Security headers are set

---

## 🚀 **Production URLs**

After successful deployment:

- **Frontend**: `https://your-app.netlify.app`
- **Backend API**: `https://your-railway-backend.railway.app/api`
- **Health Check**: `https://your-railway-backend.railway.app/health`
- **Metrics**: `https://your-railway-backend.railway.app/metrics`

### **Test Credentials**
- **Admin**: admin@ecowater.com / Admin123!
- **User**: john.doe@example.com / User123!

---

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway and Netlify documentation
3. Check application logs for error messages
4. Verify all environment variables are correctly set

---

**🎉 Your EcoFlow Water Bottles platform is now live and ready for production traffic!**
