import { VendorCommission, VendorPayout, Vendor } from '@ecommerce/shared'

export interface CommissionNotification {
  id: string
  vendor_id: string
  type: 'commission_earned' | 'commission_confirmed' | 'commission_disputed' | 'payout_processed' | 'payout_failed'
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export class CommissionNotificationService {
  private notifications: CommissionNotification[] = []

  async createCommissionEarnedNotification(
    vendor: Vendor,
    commission: VendorCommission
  ): Promise<CommissionNotification> {
    const notification: CommissionNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      vendor_id: vendor.id,
      type: 'commission_earned',
      title: 'New Commission Earned',
      message: `You earned $${commission.commission_amount.toFixed(2)} commission from order #${commission.order_id.slice(-6)}`,
      data: {
        commission_id: commission.id,
        order_id: commission.order_id,
        amount: commission.commission_amount,
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    this.notifications.push(notification)
    
    // Send email notification if enabled
    await this.sendEmailNotification(vendor, notification)
    
    // Send push notification if enabled
    await this.sendPushNotification(vendor, notification)

    return notification
  }

  async createCommissionConfirmedNotification(
    vendor: Vendor,
    commission: VendorCommission
  ): Promise<CommissionNotification> {
    const notification: CommissionNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      vendor_id: vendor.id,
      type: 'commission_confirmed',
      title: 'Commission Confirmed',
      message: `Your commission of $${commission.commission_amount.toFixed(2)} has been confirmed and will be included in your next payout`,
      data: {
        commission_id: commission.id,
        order_id: commission.order_id,
        amount: commission.commission_amount,
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    this.notifications.push(notification)
    await this.sendEmailNotification(vendor, notification)

    return notification
  }

  async createPayoutProcessedNotification(
    vendor: Vendor,
    payout: VendorPayout
  ): Promise<CommissionNotification> {
    const notification: CommissionNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      vendor_id: vendor.id,
      type: 'payout_processed',
      title: 'Payout Processed',
      message: `Your payout of $${payout.net_payout.toFixed(2)} has been processed and should arrive within 2-3 business days`,
      data: {
        payout_id: payout.id,
        amount: payout.net_payout,
        method: payout.payment_method,
        period_start: payout.payout_period_start,
        period_end: payout.payout_period_end,
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    this.notifications.push(notification)
    await this.sendEmailNotification(vendor, notification)

    return notification
  }

  async createCommissionDisputedNotification(
    vendor: Vendor,
    commission: VendorCommission,
    reason: string
  ): Promise<CommissionNotification> {
    const notification: CommissionNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      vendor_id: vendor.id,
      type: 'commission_disputed',
      title: 'Commission Under Review',
      message: `Your commission for order #${commission.order_id.slice(-6)} is under review. Reason: ${reason}`,
      data: {
        commission_id: commission.id,
        order_id: commission.order_id,
        amount: commission.commission_amount,
        dispute_reason: reason,
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    this.notifications.push(notification)
    await this.sendEmailNotification(vendor, notification)

    return notification
  }

  async getVendorNotifications(vendorId: string): Promise<CommissionNotification[]> {
    return this.notifications
      .filter(notification => notification.vendor_id === vendorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  async markAllNotificationsAsRead(vendorId: string): Promise<void> {
    this.notifications
      .filter(n => n.vendor_id === vendorId)
      .forEach(n => n.read = true)
  }

  private async sendEmailNotification(vendor: Vendor, notification: CommissionNotification): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log('Sending email notification to:', vendor.contact_info.email)
    console.log('Subject:', notification.title)
    console.log('Message:', notification.message)
    
    // Mock email service integration
    try {
      // await emailService.send({
      //   to: vendor.contact_info.email,
      //   subject: notification.title,
      //   html: this.generateEmailTemplate(notification, vendor)
      // })
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  private async sendPushNotification(vendor: Vendor, notification: CommissionNotification): Promise<void> {
    // In a real implementation, this would integrate with a push notification service
    console.log('Sending push notification to vendor:', vendor.id)
    console.log('Title:', notification.title)
    console.log('Message:', notification.message)
  }

  private generateEmailTemplate(notification: CommissionNotification, vendor: Vendor): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${notification.title}</h2>
            <p style="color: #666; margin: 0;">Hello ${vendor.business_name},</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; line-height: 1.6;">${notification.message}</p>
            
            ${this.generateNotificationDetails(notification)}
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Visit your vendor dashboard to view more details.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateNotificationDetails(notification: CommissionNotification): string {
    switch (notification.type) {
      case 'commission_earned':
        return `
          <div style="background-color: #d4edda; padding: 15px; border-radius: 4px; margin-top: 15px;">
            <strong>Commission Details:</strong><br>
            Order ID: ${notification.data.order_id}<br>
            Amount: $${notification.data.amount.toFixed(2)}
          </div>
        `
      case 'payout_processed':
        return `
          <div style="background-color: #cce5ff; padding: 15px; border-radius: 4px; margin-top: 15px;">
            <strong>Payout Details:</strong><br>
            Amount: $${notification.data.amount.toFixed(2)}<br>
            Method: ${notification.data.method}<br>
            Period: ${new Date(notification.data.period_start).toLocaleDateString()} - ${new Date(notification.data.period_end).toLocaleDateString()}
          </div>
        `
      default:
        return ''
    }
  }

  // Dashboard integration methods
  async getUnreadNotificationCount(vendorId: string): Promise<number> {
    return this.notifications.filter(n => 
      n.vendor_id === vendorId && !n.read
    ).length
  }

  async getRecentNotifications(vendorId: string, limit = 5): Promise<CommissionNotification[]> {
    return this.notifications
      .filter(n => n.vendor_id === vendorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }
}

export const commissionNotificationService = new CommissionNotificationService()