// Notification Service Unit Tests
// Testing the Observer Pattern implementation

import notificationService from '../../../src/services/notification.js';

describe('Notification Service (Observer Pattern)', () => {
  let observers;

  beforeEach(() => {
    // Store references to clean up after each test
    observers = [];
  });

  afterEach(() => {
    // Unsubscribe all observers to clean up state
    observers.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    observers = [];
  });

  describe('subscribe', () => {
    it('should add an observer to the list', () => {
      // Arrange
      const observer = jest.fn();

      // Act
      const unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);

      // Assert
      expect(typeof unsubscribe).toBe('function');
      // Verify observer is called when notified
      notificationService.notify('info', 'Test');
      expect(observer).toHaveBeenCalled();
    });

    it('should return an unsubscribe function', () => {
      // Arrange
      const observer = jest.fn();

      // Act
      const unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);

      // Assert
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should allow unsubscribing an observer', () => {
      // Arrange
      const observer = jest.fn();
      const unsubscribe = notificationService.subscribe(observer);

      // Act
      unsubscribe();

      // Assert - verify observer is not called after unsubscribe
      notificationService.notify('info', 'Test message');
      expect(observer).not.toHaveBeenCalled();
    });
  });

  describe('notify', () => {
    it('should call all subscribed observers', () => {
      // Arrange
      const observer1 = jest.fn();
      const observer2 = jest.fn();

      const unsub1 = notificationService.subscribe(observer1);
      const unsub2 = notificationService.subscribe(observer2);
      observers.push(unsub1, unsub2);

      // Act
      notificationService.notify('success', 'Test message');

      // Assert
      expect(observer1).toHaveBeenCalledTimes(1);
      expect(observer1).toHaveBeenCalledWith('success', 'Test message');
      expect(observer2).toHaveBeenCalledTimes(1);
      expect(observer2).toHaveBeenCalledWith('success', 'Test message');
    });

    it('should pass correct type and message to observers', () => {
      // Arrange
      const observer = jest.fn();
      const unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);

      // Act
      notificationService.notify('error', 'Error occurred');

      // Assert
      expect(observer).toHaveBeenCalledWith('error', 'Error occurred');
    });

    it('should handle multiple notifications', () => {
      // Arrange
      const observer = jest.fn();
      const unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);

      // Act
      notificationService.notify('info', 'Message 1');
      notificationService.notify('warning', 'Message 2');

      // Assert
      expect(observer).toHaveBeenCalledTimes(2);
      expect(observer).toHaveBeenNthCalledWith(1, 'info', 'Message 1');
      expect(observer).toHaveBeenNthCalledWith(2, 'warning', 'Message 2');
    });

    it('should handle null or undefined observers gracefully', () => {
      // Arrange
      const observer = jest.fn();
      const unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);
      notificationService.subscribe(null);
      notificationService.subscribe(undefined);

      // Act & Assert - should not throw
      expect(() => {
        notificationService.notify('info', 'Test');
      }).not.toThrow();

      // Valid observer should still be called
      expect(observer).toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    let observer;
    let unsubscribe;

    beforeEach(() => {
      observer = jest.fn();
      unsubscribe = notificationService.subscribe(observer);
      observers.push(unsubscribe);
    });

    it('success method should notify with success type', () => {
      // Act
      notificationService.success('Operation successful');

      // Assert
      expect(observer).toHaveBeenCalledWith('success', 'Operation successful');
    });

    it('error method should notify with error type', () => {
      // Act
      notificationService.error('Operation failed');

      // Assert
      expect(observer).toHaveBeenCalledWith('error', 'Operation failed');
    });

    it('info method should notify with info type', () => {
      // Act
      notificationService.info('Information message');

      // Assert
      expect(observer).toHaveBeenCalledWith('info', 'Information message');
    });

    it('warning method should notify with warning type', () => {
      // Act
      notificationService.warning('Warning message');

      // Assert
      expect(observer).toHaveBeenCalledWith('warning', 'Warning message');
    });
  });

  describe('Observer Pattern Implementation', () => {
    it('should support multiple observers for same notification', () => {
      // Arrange
      const observer1 = jest.fn();
      const observer2 = jest.fn();
      const observer3 = jest.fn();

      const unsub1 = notificationService.subscribe(observer1);
      const unsub2 = notificationService.subscribe(observer2);
      const unsub3 = notificationService.subscribe(observer3);
      observers.push(unsub1, unsub2, unsub3);

      // Act
      notificationService.notify('info', 'Broadcast message');

      // Assert
      expect(observer1).toHaveBeenCalled();
      expect(observer2).toHaveBeenCalled();
      expect(observer3).toHaveBeenCalled();
    });

    it('should maintain observer list after unsubscribe', () => {
      // Arrange
      const observer1 = jest.fn();
      const observer2 = jest.fn();
      const observer3 = jest.fn();

      const unsub1 = notificationService.subscribe(observer1);
      const unsub2 = notificationService.subscribe(observer2);
      const unsub3 = notificationService.subscribe(observer3);
      observers.push(unsub1, unsub3);

      // Unsubscribe observer2
      unsub2();

      // Act
      notificationService.notify('info', 'Test');

      // Assert
      expect(observer1).toHaveBeenCalled();
      expect(observer2).not.toHaveBeenCalled();
      expect(observer3).toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should export a singleton instance', () => {
      // Import again to verify singleton
      const importedService = require('../../../src/services/notification.js').default;
      
      // Act - subscribe to original, notify on imported (or vice versa)
      const observer = jest.fn();
      notificationService.subscribe(observer);

      // Assert
      expect(notificationService).toBe(importedService);
    });
  });
});
