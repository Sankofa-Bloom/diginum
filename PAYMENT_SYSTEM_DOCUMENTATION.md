# Payment System Documentation

## Overview

The DigiNum payment system has been completely rebuilt to integrate with the AccountPe API for handling payment transactions. This system provides a secure and reliable way for users to add funds to their accounts and purchase services.

## Architecture

### Frontend Components
- **AddFunds Component**: Handles user input for adding funds (country selection and amount)
- **PaymentService**: Manages all payment-related API calls and business logic

### Backend Services
- **Netlify Functions**: Serverless functions that proxy requests to AccountPe API
- **Supabase Database**: Stores transaction records and user balances
- **AccountPe API**: External payment processor for creating payment links and checking status

## API Integration

### AccountPe API Endpoints

#### 1. Create Payment Link
- **Endpoint**: `POST /create_payment_links`
- **Base URL**: `https://api.accountpe.com/api/payin`
- **Required Fields**:
  - `country_code`: ISO country code (e.g., 'US', 'NG', 'CM')
  - `name`: Customer's full name
  - `email`: Customer's email address
  - `amount`: Amount in smallest currency unit (cents for USD)
  - `transaction_id`: Unique transaction identifier
  - `pass_digital_charge`: Boolean flag for digital charges

#### 2. Check Payment Status
- **Endpoint**: `POST /payment_link_status`
- **Required Fields**:
  - `transaction_id`: Transaction identifier to check

### Netlify Function Endpoints

#### 1. Create Payment Link
- **Endpoint**: `POST /api/payments/create-link`
- **Function**: `netlify/functions/api/payments/create-link.js`
- **Functionality**: 
  - Validates request data
  - Calls AccountPe API
  - Returns payment URL and transaction details
  - Falls back to mock response in development/testing

#### 2. Check Payment Status
- **Endpoint**: `POST /api/payments/status`
- **Function**: `netlify/functions/api/payments/status.js`
- **Functionality**:
  - Validates transaction ID
  - Calls AccountPe API for status
  - Returns current payment status
  - Falls back to mock response in development/testing

#### 3. Payment Webhook
- **Endpoint**: `POST /webhooks/payment`
- **Function**: `netlify/functions/payment-webhook.js`
- **Functionality**:
  - Receives real-time payment updates from AccountPe
  - Updates transaction status in database
  - Credits user account upon successful payment
  - Handles various payment statuses

## Payment Flow

### 1. Add Funds Process
```
User Input → Validation → Create Transaction Record → Call AccountPe API → Return Payment Link
```

### 2. Payment Processing
```
User Clicks Payment Link → AccountPe Payment Page → Payment Processing → Webhook Notification → Update Database → Credit Account
```

### 3. Status Checking
```
Frontend Request → Netlify Function → AccountPe API → Return Status → Update UI
```

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
  type VARCHAR(20) NOT NULL, -- 'deposit', 'purchase', 'refund'
    amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
    country_code VARCHAR(2),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_mobile VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Balances Table
```sql
CREATE TABLE user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  currency VARCHAR(3) DEFAULT 'USD',
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_BASE_URL=https://diginum.netlify.app/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Netlify Functions
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ACCOUNTPE_API_KEY=your_accountpe_api_key
NODE_ENV=production
TEST_MODE=false
```

### Netlify Configuration
```toml
# API redirects
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

# Payment webhook
[[redirects]]
  from = "/webhooks/payment"
  to = "/.netlify/functions/payment-webhook"
  status = 200
```

## Security Features

### 1. Authentication
- All payment endpoints require valid Supabase JWT tokens
- User authentication verified before processing payments

### 2. Data Validation
- Input validation on both frontend and backend
- Required field validation for AccountPe API calls
- Amount validation to prevent negative or zero amounts

### 3. Transaction Security
- Unique transaction IDs generated for each payment
- Reference numbers for internal tracking
- Metadata storage for audit trails

### 4. Webhook Security
- Webhook endpoint for real-time updates
- Secure database operations with service role key
- Error handling and logging for debugging

## Error Handling

### 1. API Failures
- Graceful fallback to mock responses in development
- Comprehensive error logging
- User-friendly error messages

### 2. Database Errors
- Transaction rollback on failures
- Detailed error logging
- Fallback mechanisms for critical operations

### 3. Network Issues
- Timeout handling (30 seconds)
- Retry mechanisms for failed requests
- Offline fallback options

## Development and Testing

### 1. Mock Mode
- Enable with `TEST_MODE=true` environment variable
- Provides mock responses when AccountPe API is unavailable
- Useful for development and testing

### 2. Local Development
- Use local backend with `VITE_API_BASE_URL=http://localhost:3000/api`
- Test with local Supabase instance
- Mock payment responses for development

### 3. Testing
- Unit tests for payment service
- Integration tests for Netlify functions
- End-to-end payment flow testing

## Monitoring and Logging

### 1. Function Logs
- Comprehensive logging in all Netlify functions
- Transaction tracking and debugging
- Error logging with context

### 2. Database Monitoring
- Transaction status tracking
- Balance updates monitoring
- Audit trail maintenance

### 3. API Monitoring
- AccountPe API response monitoring
- Payment success/failure rates
- Response time tracking

## Deployment

### 1. Netlify Deployment
- Automatic deployment from main branch
- Function deployment with dependencies
- Environment variable configuration

### 2. Production Setup
- Configure AccountPe API credentials
- Set production environment variables
- Enable webhook endpoints

### 3. Monitoring
- Set up logging and monitoring
- Configure error alerts
- Monitor payment success rates

## Troubleshooting

### Common Issues

#### 1. Payment Link Creation Fails
- Check AccountPe API credentials
- Verify required fields are provided
- Check network connectivity

#### 2. Webhook Not Received
- Verify webhook URL configuration
- Check function deployment status
- Monitor function logs

#### 3. Balance Not Updated
- Check transaction status in database
- Verify webhook processing
- Check database permissions

### Debug Steps

1. **Check Function Logs**: Monitor Netlify function logs for errors
2. **Verify API Calls**: Test AccountPe API endpoints directly
3. **Database Queries**: Check transaction and balance tables
4. **Environment Variables**: Verify all required variables are set

## Future Enhancements

### 1. Additional Payment Methods
- Credit card processing
- Bank transfer integration
- Mobile money services

### 2. Enhanced Security
- Webhook signature verification
- Rate limiting
- Fraud detection

### 3. Analytics and Reporting
- Payment analytics dashboard
- Transaction reporting
- Revenue tracking

### 4. Multi-currency Support
- Support for additional currencies
- Real-time exchange rates
- Currency conversion

## Support

For technical support or questions about the payment system:

1. Check the function logs in Netlify dashboard
2. Review database transactions and balances
3. Test API endpoints with Postman or similar tools
4. Contact the development team for complex issues

## Changelog

### Version 2.0.0 (Current)
- Complete rebuild with AccountPe API integration
- Real-time webhook processing
- Enhanced security and error handling
- Comprehensive logging and monitoring

### Version 1.0.0 (Previous)
- Basic payment functionality
- Mock payment processing
- Limited error handling
