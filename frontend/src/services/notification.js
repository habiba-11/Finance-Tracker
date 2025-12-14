// Notification Service - Observer Pattern
// Manages toast notifications throughout the application

class NotificationService {
  constructor() {
    this.observers = [];
  }

  // Subscribe to notifications
  subscribe(observer) {
    this.observers.push(observer);
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  // Notify all observers
  notify(type, message) {
    this.observers.forEach(observer => {
      if (observer && typeof observer === 'function') {
        observer(type, message);
      }
    });
  }

  // Convenience methods
  success(message) {
    this.notify('success', message);
  }

  error(message) {
    this.notify('error', message);
  }

  info(message) {
    this.notify('info', message);
  }

  warning(message) {
    this.notify('warning', message);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;


