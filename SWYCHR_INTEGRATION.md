# Swychr Payment Integration

## Overview
Simple add funds button that redirects users to Swychr payment gateway.

## Setup

### 1. Environment Variables
Add these to your Netlify environment variables:
```bash
SWYCHR_EMAIL=your_swychr_email
SWYCHR_PASSWORD=your_swychr_password
```

### 2. Usage
The `AddFundsButton` component is already added to the BuyPage. Users can:
- Click "Add $5", "Add $10", or "Add $20" buttons
- Get redirected to Swychr payment page
- Complete payment
- Return with funds added to their account

### 3. How It Works
1. User clicks add funds button
2. Frontend calls `/swychr-create-payment` function
3. Function authenticates with Swychr API
4. Creates payment link and redirects user
5. User completes payment on Swychr
6. Swychr sends webhook to `/swychr-webhook`
7. Webhook adds funds to user's balance

### 4. Files Created
- `src/components/AddFundsButton.tsx` - Simple button component
- `netlify/functions/swychr-create-payment.js` - Creates payment links
- `netlify/functions/swychr-webhook.js` - Processes successful payments
- Updated `netlify.toml` with environment variables and redirects

## Testing
1. Set environment variables in Netlify
2. Deploy functions
3. Click add funds button
4. Should redirect to Swychr payment page

## Notes
- Amounts are in USD
- User gets redirected to Swychr for payment
- After payment, funds are automatically added to account
- Simple and straightforward integration
