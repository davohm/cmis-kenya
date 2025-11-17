import { supabase } from '../lib/supabase';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export function useNotifications() {
  const createNotification = async (data: NotificationData) => {
    try {
      // In a real system, this would:
      // 1. Create a notification record in the database
      // 2. Send an email via SendGrid/AWS SES
      // 3. Send push notification if mobile app exists
      
      // For now, we'll just log it and could extend later
      console.log('Notification created:', data);
      
      // Optional: Create notification record for in-app display
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        // If notifications table doesn't exist, just log
        console.log('Notification logged (table may not exist):', data);
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  };

  const notifyApplicationStatus = async (
    applicantUserId: string,
    applicationNumber: string,
    status: string,
    cooperativeName: string
  ) => {
    const messages = {
      APPROVED: {
        title: 'Application Approved! 🎉',
        message: `Your application ${applicationNumber} for "${cooperativeName}" has been approved. You can now proceed with the next steps.`,
        type: 'success' as const
      },
      REJECTED: {
        title: 'Application Update',
        message: `Your application ${applicationNumber} for "${cooperativeName}" requires attention. Please review the feedback provided.`,
        type: 'warning' as const
      },
      ADDITIONAL_INFO_REQUIRED: {
        title: 'Additional Information Required',
        message: `Your application ${applicationNumber} for "${cooperativeName}" requires additional information. Please provide the requested details.`,
        type: 'info' as const
      }
    };

    const notification = messages[status as keyof typeof messages];
    if (notification) {
      await createNotification({
        user_id: applicantUserId,
        ...notification
      });
    }
  };

  const notifyComplianceStatus = async (
    cooperativeAdmins: string[],
    reportNumber: string,
    status: string,
    cooperativeName: string
  ) => {
    const messages = {
      COMPLIANT: {
        title: 'Compliance Report Approved ✓',
        message: `Compliance report ${reportNumber} for ${cooperativeName} has been approved.`,
        type: 'success' as const
      },
      NON_COMPLIANT: {
        title: 'Compliance Issues Detected',
        message: `Compliance report ${reportNumber} for ${cooperativeName} has issues that need attention.`,
        type: 'error' as const
      }
    };

    const notification = messages[status as keyof typeof messages];
    if (notification) {
      // Send to all cooperative admins
      for (const adminId of cooperativeAdmins) {
        await createNotification({
          user_id: adminId,
          ...notification
        });
      }
    }
  };

  return {
    createNotification,
    notifyApplicationStatus,
    notifyComplianceStatus
  };
}
