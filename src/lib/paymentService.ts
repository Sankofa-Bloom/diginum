import { supabase } from './supabaseClient';
import { getCurrentUser } from './auth';

export interface PaymentLinkRequest {
  country_code: string;
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  transaction_id: string;
  description?: string;
  pass_digital_charge: boolean;
}

export interface PaymentLinkResponse {
  success: boolean;
  data?: any;
  status: number;
  message: string;
  transaction_id?: string;
  payment_url?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  data?: any;
  status: number;
  message: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'purchase' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  transaction_id?: string;
  payment_method?: string;
  country_code?: string;
  customer_name?: string;
  customer_email?: string;
  customer_mobile?: string;
}

export interface AddFundsRequest {
  amount: number;
  country_code: string;
  description?: string;
}

export interface AddFundsResponse {
  success: boolean;
  transaction_id: string;
  payment_url: string;
  reference: string;
  message: string;
}

export class PaymentService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  /**
   * Create a payment link for adding funds
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/payments/create-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.data,
          status: data.status,
          message: data.message,
          transaction_id: data.transaction_id,
          payment_url: data.data?.payment_url || data.data?.url
        };
      } else {
        return {
          success: false,
          status: data.status || response.status,
          message: data.message || 'Failed to create payment link'
        };
      }
    } catch (error) {
      console.error('Create payment link error:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal error occurred'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/payments/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: transactionId }),
      });

      const data = await response.json();

      if (response.ok && data.status === 200) {
        return {
          success: true,
          data: data.data,
          status: data.status,
          message: data.message,
          payment_status: this.mapPaymentStatus(data.data?.status)
        };
      } else {
        return {
          success: false,
          status: data.status || response.status,
          message: data.message || 'Failed to get payment status'
        };
      }
    } catch (error) {
      console.error('Check payment status error:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal error occurred'
      };
    }
  }

  /**
   * Create a payment link for adding funds
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      // Ensure we have an auth token
      if (!this.authToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return {
            success: false,
            status: 401,
            message: 'Authentication failed'
          };
        }
      }

      const response = await fetch(`${this.baseUrl}/create_payment_links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (response.ok && data.status === 200) {
        return {
          success: true,
          data: data.data,
          status: data.status,
          message: data.message,
          transaction_id: data.transaction_id,
          payment_url: data.data?.payment_url || data.data?.url
        };
      } else {
        return {
          success: false,
          status: data.status || response.status,
          message: data.message || 'Failed to create payment link'
        };
      }
    } catch (error) {
      console.error('Create payment link error:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal error occurred'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      if (!this.authToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return {
            success: false,
            status: 401,
            message: 'Authentication failed'
          };
        }
      }

      const response = await fetch(`${this.baseUrl}/payment_link_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ transaction_id: transactionId }),
      });

      const data = await response.json();

      if (response.ok && data.status === 200) {
        return {
          success: true,
          data: data.data,
          status: data.status,
          message: data.message,
          payment_status: this.mapPaymentStatus(data.data?.status)
        };
      } else {
        return {
          success: false,
          status: data.status || response.status,
          message: data.message || 'Failed to get payment status'
        };
      }
    } catch (error) {
      console.error('Check payment status error:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal error occurred'
      };
    }
  }

  /**
   * Add funds to user account
   */
  async addFunds(request: AddFundsRequest): Promise<AddFundsResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate amount
      if (request.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reference = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: request.amount,
          currency: 'USD',
          status: 'pending',
          reference,
          description: request.description || `Add funds - ${request.amount} USD`,
          transaction_id: transactionId,
          country_code: request.country_code,
          customer_name: user.user_metadata?.full_name || user.email || 'User',
          customer_email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error(`Failed to create transaction: ${transactionError.message}`);
      }

      // Create payment link via backend
      const paymentRequest: PaymentLinkRequest = {
        country_code: request.country_code,
        name: user.user_metadata?.full_name || user.email || 'User',
        email: user.email || '',
        mobile: user.phone || undefined,
        amount: Math.round(request.amount * 100), // Convert to smallest currency unit
        transaction_id: transactionId,
        description: `Add funds to DigiNum account - ${request.amount} USD`,
        pass_digital_charge: false
      };

      const paymentResponse = await this.createPaymentLink(paymentRequest);

      if (!paymentResponse.success) {
        // Update transaction status to failed
        await supabase
          .from('transactions')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        throw new Error(paymentResponse.message);
      }

      // Update transaction with payment details
      await supabase
        .from('transactions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      return {
        success: true,
        transaction_id: transactionId,
        payment_url: paymentResponse.payment_url || '',
        reference,
        message: 'Payment link created successfully'
      };
    } catch (error) {
      console.error('Add funds error:', error);
      return {
        success: false,
        transaction_id: '',
        payment_url: '',
        reference: '',
        message: error instanceof Error ? error.message : 'Failed to add funds'
      };
    }
  }

  /**
   * Process service purchase
   */
  async processServicePurchase(serviceId: number, countryId: string): Promise<{ success: boolean; orderId?: string; message: string }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('country_id', countryId)
        .single();

      if (serviceError || !service) {
        throw new Error('Service not found');
      }

      // Check if user has sufficient balance
      const { data: balance, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'USD')
        .single();

      if (balanceError || !balance) {
        throw new Error('User balance not found');
      }

      if (balance.balance < service.app_price) {
        throw new Error(`Insufficient balance. Required: $${service.app_price} USD, Available: $${balance.balance} USD`);
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          country_id: countryId,
          amount: service.app_price,
          currency: 'USD',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Deduct balance
      const newBalance = balance.balance - service.app_price;
      const { error: updateBalanceError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('currency', 'USD');

      if (updateBalanceError) {
        throw new Error(`Failed to update balance: ${updateBalanceError.message}`);
      }

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: service.app_price,
          currency: 'USD',
          status: 'completed',
          reference: `PUR_${order.id}`,
          description: `Service purchase: ${service.name}`,
          metadata: {
            orderId: order.id,
            serviceId: serviceId,
            countryId: countryId
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      return {
        success: true,
        orderId: order.id,
        message: 'Service purchased successfully'
      };
    } catch (error) {
      console.error('Service purchase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to purchase service'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(page: number = 1, limit: number = 10): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number; hasMore: boolean }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const offset = (page - 1) * limit;

      const { data: transactions, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      return {
        transactions: transactions || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Get transaction history error:', error);
      return {
        transactions: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  /**
   * Get user balance
   */
  async getUserBalance(): Promise<number> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return 0;
      }

      const { data: balance, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'USD')
        .single();

      if (error || !balance) {
        return 0;
      }

      return balance.balance;
    } catch (error) {
      console.error('Get user balance error:', error);
      return 0;
    }
  }

  /**
   * Verify payment and credit account
   */
  async verifyPayment(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const statusResponse = await this.checkPaymentStatus(transactionId);
      
      if (statusResponse.success && statusResponse.payment_status === 'completed') {
        // Update transaction status
        await this.updateTransactionStatus(transactionId, 'completed');
        
        // Credit user account
        await this.creditUserAccount(transactionId);
      }

      return statusResponse;
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        status: 500,
        message: 'Payment verification failed'
      };
    }
  }

  /**
   * Update transaction status
   */
  private async updateTransactionStatus(transactionId: string, status: string): Promise<void> {
    try {
      await supabase
        .from('transactions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);
    } catch (error) {
      console.error('Update transaction status error:', error);
    }
  }

  /**
   * Credit user account after successful payment
   */
  private async creditUserAccount(transactionId: string): Promise<void> {
    try {
      // Get transaction details
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('user_id, amount, currency')
        .eq('transaction_id', transactionId)
        .single();

      if (transactionError || !transaction) {
        console.error('Transaction not found:', transactionId);
        return;
      }

      // Get or create user balance record
      let { data: balance, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('currency', transaction.currency)
        .single();

      if (balanceError || !balance) {
        // Create new balance record
        const { error: createError } = await supabase
          .from('user_balances')
          .insert({
            user_id: transaction.user_id,
            currency: transaction.currency,
            balance: transaction.amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Failed to create balance:', createError);
          return;
        }
      } else {
        // Update existing balance
        const newBalance = balance.balance + transaction.amount;
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id)
          .eq('currency', transaction.currency);

        if (updateError) {
          console.error('Failed to update balance:', updateError);
          return;
        }
      }
    } catch (error) {
      console.error('Error crediting user account:', error);
    }
  }

  /**
   * Map API status to internal status
   */
  private mapPaymentStatus(apiStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (apiStatus?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Get supported countries
   */
  getSupportedCountries(): string[] {
    return [
      'CM', // Cameroon
      'NG', // Nigeria
      'GH', // Ghana
      'KE', // Kenya
      'SN', // Senegal
      'CI', // Ivory Coast
      'UG', // Uganda
      'TZ', // Tanzania
      'US', // United States
      'GB', // United Kingdom
      'EU', // European Union
      'CA', // Canada
      'AU', // Australia
      'IN', // India
      'CN', // China
      'JP', // Japan
      'BR', // Brazil
      'MX', // Mexico
      'ZA', // South Africa
      'EG'  // Egypt
    ];
  }

  /**
   * Get supported currencies (USD only)
   */
  getSupportedCurrencies(): string[] {
    return ['USD']; // US Dollar only
  }
}

export const paymentService = new PaymentService();
