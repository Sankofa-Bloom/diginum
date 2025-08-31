# 🔧 Backend Payment API Specification

## 📋 Overview

This document specifies the backend API endpoints that the frontend will call for payment processing. The backend handles all communication with the AccountPe API while keeping credentials secure.

## 🏗️ API Endpoints

### **Base URL**
```
http://localhost:3000/api
```

### **1. Create Payment Link**
**Endpoint**: `POST /payments/create-link`

**Request Body**:
```json
{
  "country_code": "NG",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+2348012345678",
  "amount": 10000,
  "transaction_id": "TXN_123456789",
  "description": "Add funds to DigiNum account - 100 USD",
  "pass_digital_charge": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "payment_url": "https://payment.accountpe.com/pay/abc123",
    "transaction_id": "TXN_123456789"
  },
  "status": 200,
  "message": "Payment link created successfully"
}
```

### **2. Check Payment Status**
**Endpoint**: `POST /payments/status`

**Request Body**:
```json
{
  "transaction_id": "TXN_123456789"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "amount": 10000,
    "currency": "USD"
  },
  "status": 200,
  "message": "Payment status retrieved successfully"
}
```

## 🔐 Backend Implementation

### **Required Environment Variables**
```bash
# AccountPe API Credentials (Backend only)
ACCOUNTPE_API_URL=https://api.accountpe.com/api/payin
ACCOUNTPE_EMAIL=your_payment_api_email
ACCOUNTPE_PASSWORD=your_payment_api_password

# Backend Configuration
PORT=3000
NODE_ENV=development
```

### **Backend Dependencies**
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0"
  }
}
```

### **Backend Routes Structure**
```javascript
// routes/payments.js
const express = require('express');
const router = express.Router();

// Create payment link
router.post('/create-link', async (req, res) => {
  try {
    // 1. Authenticate with AccountPe API
    const authResponse = await authenticateWithAccountPe();
    
    // 2. Create payment link
    const paymentResponse = await createAccountPePaymentLink(req.body, authResponse.token);
    
    // 3. Return response to frontend
    res.json({
      success: true,
      data: paymentResponse.data,
      status: 200,
      message: 'Payment link created successfully',
      transaction_id: req.body.transaction_id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
});

// Check payment status
router.post('/status', async (req, res) => {
  try {
    // 1. Authenticate with AccountPe API
    const authResponse = await authenticateWithAccountPe();
    
    // 2. Check payment status
    const statusResponse = await checkAccountPePaymentStatus(req.body.transaction_id, authResponse.token);
    
    // 3. Return response to frontend
    res.json({
      success: true,
      data: statusResponse.data,
      status: 200,
      message: 'Payment status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
});

module.exports = router;
```

### **AccountPe Integration Functions**
```javascript
// services/accountpe.js
const axios = require('axios');

class AccountPeService {
  constructor() {
    this.baseUrl = process.env.ACCOUNTPE_API_URL;
    this.email = process.env.ACCOUNTPE_EMAIL;
    this.password = process.env.ACCOUNTPE_PASSWORD;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/auth`, {
        email: this.email,
        password: this.password
      });
      
      return {
        token: response.data.token || response.data.access_token,
        success: true
      };
    } catch (error) {
      throw new Error('AccountPe authentication failed');
    }
  }

  async createPaymentLink(paymentData, authToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/create_payment_links`, paymentData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to create AccountPe payment link');
    }
  }

  async checkPaymentStatus(transactionId, authToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/payment_link_status`, {
        transaction_id: transactionId
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to check AccountPe payment status');
    }
  }
}

module.exports = new AccountPeService();
```

## 🚀 Getting Started

### **1. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Fill in AccountPe credentials
npm start
```

### **2. Frontend Configuration**
```bash
# In frontend .env file
VITE_API_BASE_URL=http://localhost:3000/api
```

### **3. Test Endpoints**
```bash
# Test payment link creation
curl -X POST http://localhost:3000/api/payments/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "NG",
    "name": "Test User",
    "email": "test@example.com",
    "amount": 1000,
    "transaction_id": "TXN_TEST_123",
    "description": "Test payment",
    "pass_digital_charge": false
  }'
```

## 🔒 Security Considerations

1. **Credential Storage**: API credentials stored only on backend
2. **Environment Variables**: Sensitive data in backend .env file
3. **CORS Configuration**: Restrict frontend origins
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Validate all incoming requests
6. **Error Handling**: Don't expose sensitive error details

## 📱 Frontend Integration

The frontend now calls these backend endpoints instead of directly calling AccountPe:

```typescript
// Before (direct AccountPe call)
const response = await fetch('https://api.accountpe.com/api/payin/create_payment_links', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(paymentData)
});

// After (backend proxy)
const response = await fetch('/api/payments/create-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
});
```

## 🎯 Benefits

1. **Security**: API credentials never exposed to frontend
2. **Maintainability**: Centralized payment logic on backend
3. **Scalability**: Easy to add caching, logging, monitoring
4. **Flexibility**: Can switch payment providers without frontend changes
5. **Compliance**: Better security compliance for production use
