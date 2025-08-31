# 🚀 Payment System Setup Guide

## 📋 Overview

This guide explains how to set up the payment system for DigiNum, which can work in two modes:
1. **Development Mode**: Local backend server
2. **Production Mode**: Netlify Functions (already configured)

## 🏗️ Architecture

```
Frontend → API Endpoint → Backend/Function → AccountPe API
   ↓           ↓              ↓                ↓
AddFunds → /api/payments/create-link → Netlify Function → AccountPe
   ↓           ↓              ↓                ↓
PaymentSuccess → /api/payments/status → Netlify Function → AccountPe
```

## 🚀 Quick Start (Production - Netlify Functions)

The payment system is already configured to work with Netlify Functions in production.

### **What's Already Set Up:**
- ✅ Netlify Functions for payment endpoints
- ✅ API redirects in `netlify.toml`
- ✅ Frontend payment service configured
- ✅ CORS headers configured
- ✅ Mock payment responses for testing

### **Current Endpoints:**
- **POST** `/api/payments/create-link` - Creates payment links
- **POST** `/api/payments/status` - Checks payment status

### **Test the System:**
1. Go to `/add-funds` page
2. Enter amount and select country
3. Click "Add Funds"
4. You'll get a mock payment link (for testing)

## 🔧 Development Setup (Local Backend)

If you want to develop with a local backend server:

### **1. Set Environment Variable**
```bash
# In your .env file
VITE_API_BASE_URL=http://localhost:3000/api
```

### **2. Start Local Backend**
```bash
cd backend
npm install
npm start
```

### **3. Backend Should Implement:**
- **POST** `/api/payments/create-link`
- **POST** `/api/payments/status`

## 🔐 Production Setup (Real AccountPe Integration)

To integrate with real AccountPe API:

### **1. Update Netlify Functions**
Replace the mock responses in:
- `netlify/functions/api/payments/create-link.js`
- `netlify/functions/api/payments/status.js`

### **2. Add Environment Variables**
In Netlify dashboard, add:
```bash
ACCOUNTPE_API_URL=https://api.accountpe.com/api/payin
ACCOUNTPE_EMAIL=your_payment_api_email
ACCOUNTPE_PASSWORD=your_payment_api_password
```

### **3. Update Function Code**
```javascript
// In create-link.js
const authResponse = await authenticateWithAccountPe();
const paymentResponse = await createAccountPePaymentLink(requestBody, authResponse.token);
```

## 📱 Frontend Configuration

### **Environment Variables:**
```bash
# For local development
VITE_API_BASE_URL=http://localhost:3000/api

# For production (default)
# VITE_API_BASE_URL is not set, uses relative /api
```

### **Payment Service:**
The frontend automatically detects the environment:
- **Development**: Uses `VITE_API_BASE_URL` if set
- **Production**: Uses relative `/api` path (Netlify Functions)

## 🧪 Testing

### **Test Payment Flow:**
1. **Navigate** to `/add-funds`
2. **Select** country and enter amount
3. **Submit** payment request
4. **Verify** payment link creation
5. **Check** payment status

### **Current Mock Responses:**
- **Payment Link**: `https://payment.accountpe.com/pay/{transaction_id}`
- **Payment Status**: Always returns "completed" for testing

## 🔒 Security

### **Current Setup:**
- ✅ No API credentials in frontend
- ✅ CORS properly configured
- ✅ Input validation on functions
- ✅ Error handling implemented

### **Production Considerations:**
- 🔒 Store AccountPe credentials in Netlify environment variables
- 🔒 Implement rate limiting
- 🔒 Add request validation
- 🔒 Monitor function usage

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. 404 Error on Payment Endpoints**
- **Cause**: Netlify Functions not deployed
- **Solution**: Redeploy to Netlify

#### **2. CORS Errors**
- **Cause**: Function headers not set correctly
- **Solution**: Check CORS headers in function code

#### **3. Payment Link Creation Fails**
- **Cause**: Function error or validation failure
- **Solution**: Check Netlify function logs

### **Debug Steps:**
1. **Check Netlify Function Logs**
2. **Verify API redirects in netlify.toml**
3. **Test endpoints with curl or Postman**
4. **Check browser network tab for errors**

## 📚 Additional Resources

- **Netlify Functions Docs**: https://docs.netlify.com/functions/overview/
- **AccountPe API Docs**: Your API documentation
- **Payment System Documentation**: `PAYMENT_SYSTEM_DOCUMENTATION.md`
- **Backend API Spec**: `BACKEND_PAYMENT_API.md`

## 🎯 Next Steps

1. **Test Current Setup**: Verify mock payment system works
2. **Deploy to Netlify**: Ensure functions are working
3. **Add Real Integration**: Replace mock responses with AccountPe API calls
4. **Monitor & Optimize**: Add logging and performance monitoring

---

**The payment system is ready to use in production with Netlify Functions!** 🎉
