# 🚀 DigiNum Payment System - AccountPe Integration

## 📋 Overview

This document describes the complete payment system implementation for DigiNum using the **AccountPe API** for payment processing. The system provides a seamless way for users to add funds to their accounts and purchase services.

## 🏗️ Architecture

### **Payment Flow**
```
User Request → Payment Link Creation → AccountPe Processing → Payment Completion → Account Credit → Success
```

### **Components**
1. **PaymentService** - AccountPe API integration
2. **AddFunds Page** - User interface for adding funds
3. **PaymentSuccess Page** - Payment confirmation and verification
4. **Transaction Management** - Database operations and tracking
5. **Balance Management** - User account balance handling

## 💳 Backend API Integration

### **API Endpoints**
- **Base URL**: Backend API (e.g., `http://localhost:3000/api`)
- **Create Payment**: `/payments/create-link` (POST)
- **Check Status**: `/payments/status` (POST)

### **Architecture**
1. **Frontend**: Sends payment requests to backend
2. **Backend**: Handles AccountPe API authentication and communication
3. **Security**: API credentials stored securely on backend
4. **Proxy**: Backend acts as proxy for external payment APIs

### **Payment Link Creation**
```typescript
const paymentRequest = {
  country_code: "NG",           // Country code (required)
  name: "John Doe",             // Customer name (required)
  email: "john@example.com",    // Customer email (required)
  mobile: "+2348012345678",     // Customer mobile (optional)
  amount: 10000,                // Amount in smallest currency unit (required)
  transaction_id: "TXN_123",    // Unique transaction ID (required)
  description: "Payment for...", // Payment description (optional)
  pass_digital_charge: false    // Digital charge handling (required)
};
```

### **Payment Status Check**
```typescript
const statusRequest = {
  transaction_id: "TXN_123"     // Transaction ID to check
};
```

## 🔐 Security Features

### **Authentication**
- **Backend Proxy**: API credentials stored securely on backend
- **No Frontend Exposure**: Sensitive data never exposed to client
- **Secure Communication**: HTTPS communication between frontend and backend

### **Data Validation**
- **Input Sanitization**: All user inputs validated
- **Amount Limits**: Configurable payment limits
- **Country Validation**: Supported country codes only

### **Transaction Security**
- **Unique References**: Non-repeating transaction references
- **Audit Trail**: Complete transaction history
- **User Isolation**: Row-level security in database

## 💰 Add Funds Functionality

### **Features**
- **Country Selection**: 20+ supported countries with flags
- **Currency Support**: USD only for simplified operations
- **Amount Flexibility**: User-defined payment amounts
- **Real-time Processing**: Instant payment link creation
- **Transaction History**: Complete payment records

### **Supported Countries**
- **Africa**: CM (Cameroon), NG (Nigeria), GH (Ghana), KE (Kenya), SN (Senegal), CI (Ivory Coast), UG (Uganda), TZ (Tanzania), ZA (South Africa), EG (Egypt)
- **Global**: US, GB, EU, CA, AU, IN, CN, JP, BR, MX

### **Supported Currencies**
- **USD Only**: All transactions processed in US Dollars for consistency and simplicity

## 📊 Transaction Processing

### **Transaction Types**
- **Deposit**: Adding funds to account
- **Purchase**: Buying services
- **Refund**: Service refunds (future feature)

### **Transaction Statuses**
- **Pending**: Payment initiated, waiting for completion
- **Completed**: Payment successful, account credited
- **Failed**: Payment failed, no account credit
- **Cancelled**: Payment cancelled by user

### **Database Schema**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    metadata JSONB,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    country_code VARCHAR(2),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_mobile VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🎯 User Experience

### **Add Funds Flow**
1. **Select Country**: Choose from supported countries with flags
2. **Enter Amount**: Specify payment amount in USD
3. **Add Description**: Optional transaction note
4. **Create Payment**: Generate payment link
5. **Complete Payment**: Redirect to payment page
6. **Confirmation**: Payment success/verification

### **Transaction History**
- **Real-time Updates**: Live transaction status
- **Detailed Records**: Complete payment information
- **Search & Filter**: Easy transaction lookup
- **Export Options**: Download transaction data

## 🛠️ Implementation Details

### **Frontend Components**
- **AddFunds.tsx**: Main add funds interface
- **PaymentSuccess.tsx**: Payment confirmation page
- **PaymentService**: API integration and business logic

### **Backend Integration**
- **AccountPe API**: Direct API integration
- **Supabase**: Database and authentication
- **Transaction Management**: Business logic implementation

### **Environment Variables**
```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🚀 Getting Started

### **1. Environment Setup**
```bash
# Copy environment template
cp env.template .env

# Set your backend API URL
VITE_API_BASE_URL=http://localhost:3000/api
```

### **2. Database Setup**
```sql
-- Run the transactions table creation script
\i create_transactions_table.sql
```

### **3. Install Dependencies**
```bash
npm install
```

### **4. Start Development**
```bash
npm run dev
```

## 📱 Usage Examples

### **Adding Funds**
```typescript
import { paymentService } from '@/lib/paymentService';

const response = await paymentService.addFunds({
  amount: 100,
  country_code: 'US',
  description: 'Add funds to account'
});

if (response.success) {
  // Redirect to payment URL
  window.open(response.payment_url, '_blank');
}
```

### **Processing Service Purchase**
```typescript
const result = await paymentService.processServicePurchase(
  serviceId, 
  countryId
);

if (result.success) {
  // Service purchased successfully
  console.log('Order ID:', result.orderId);
}
```

### **Checking Payment Status**
```typescript
const status = await paymentService.checkPaymentStatus(transactionId);
console.log('Payment status:', status.payment_status);
```

## 🔍 Testing

### **Test Payment Flow**
1. Navigate to `/add-funds`
2. Select country (e.g., Nigeria)
3. Enter test amount (e.g., ₦1000)
4. Submit payment request
5. Verify payment link creation
6. Test payment status checking

### **Test Different Countries**
- **Cameroon**: Country code CM (USD payments)
- **Nigeria**: Country code NG (USD payments)
- **Ghana**: Country code GH (USD payments)
- **United States**: Country code US (USD payments)

## 📈 Monitoring & Analytics

### **Payment Metrics**
- Success rates by country
- Currency distribution
- Transaction volumes
- Processing times

### **User Analytics**
- Payment patterns
- Country preferences
- Amount distributions
- Conversion rates

## 🚨 Troubleshooting

### **Common Issues**
1. **Authentication Failed**: Check API credentials
2. **Payment Link Creation Failed**: Verify required fields
3. **Status Check Failed**: Ensure transaction ID is valid
4. **Database Errors**: Check Supabase connection

### **Debug Mode**
```bash
# Enable debug logging
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### **API Response Codes**
- **200**: Success
- **400**: Invalid request
- **401**: Authentication failed
- **404**: Resource not found
- **500**: Internal server error

## 🔮 Future Enhancements

### **Planned Features**
- **Webhook Support**: Real-time payment notifications
- **Recurring Payments**: Subscription billing
- **Payment Plans**: Installment payments
- **Advanced Analytics**: Business intelligence
- **Multi-User Accounts**: Business accounts

### **API Improvements**
- **Rate Limiting**: Prevent API abuse
- **Caching**: Improve response times
- **Retry Logic**: Handle temporary failures
- **Fallback Options**: Alternative payment methods

## 📞 Support

### **Documentation**
- **API Reference**: AccountPe integration guide
- **Implementation Guide**: Step-by-step setup
- **Troubleshooting**: Common issues and solutions

### **Contact**
- **Technical Support**: development@diginum.com
- **API Issues**: api@diginum.com
- **Business Inquiries**: business@diginum.com

---

## ✅ Implementation Status

- [x] AccountPe API Integration
- [x] Add Funds Functionality
- [x] Transaction Processing
- [x] Payment Verification
- [x] Multi-Country Support
- [x] Multi-Currency Support
- [x] Database Schema
- [x] User Interface
- [x] Error Handling
- [x] Documentation

**The payment system is now fully implemented and ready for production use with AccountPe!** 🎉

## 🔗 API Documentation Reference

This implementation uses a backend proxy approach:
- **Frontend**: Communicates with backend API endpoints
- **Backend**: Handles AccountPe API integration securely
- **Security**: API credentials stored on backend only
- **Architecture**: Monorepo with separated concerns
