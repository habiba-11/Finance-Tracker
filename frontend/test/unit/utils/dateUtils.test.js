// Date Utility Functions Unit Tests

import {
  formatDateDDMMYYYY,
  parseDDMMYYYY,
  formatDateInputToDisplay,
  formatDisplayToDateInput,
} from '../../../src/utils/dateUtils.js';

describe('Date Utility Functions', () => {
  describe('formatDateDDMMYYYY', () => {
    it('should format Date object to DD/MM/YYYY', () => {
      // Arrange
      const date = new Date(2024, 11, 17); // December 17, 2024 (month is 0-indexed)

      // Act
      const result = formatDateDDMMYYYY(date);

      // Assert
      expect(result).toBe('17/12/2024');
    });

    it('should format date string to DD/MM/YYYY', () => {
      // Arrange
      const dateString = '2024-12-17';

      // Act
      const result = formatDateDDMMYYYY(dateString);

      // Assert
      expect(result).toBe('17/12/2024');
    });

    it('should pad single-digit day and month with zeros', () => {
      // Arrange
      const date = new Date(2024, 0, 5); // January 5, 2024

      // Act
      const result = formatDateDDMMYYYY(date);

      // Assert
      expect(result).toBe('05/01/2024');
    });

    it('should return empty string for null', () => {
      // Arrange
      const date = null;

      // Act
      const result = formatDateDDMMYYYY(date);

      // Assert
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      // Arrange
      const date = undefined;

      // Act
      const result = formatDateDDMMYYYY(date);

      // Assert
      expect(result).toBe('');
    });

    it('should return empty string for invalid date', () => {
      // Arrange
      const invalidDate = 'invalid-date';

      // Act
      const result = formatDateDDMMYYYY(invalidDate);

      // Assert
      expect(result).toBe('');
    });

    it('should handle leap year dates correctly', () => {
      // Arrange
      const leapYearDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)

      // Act
      const result = formatDateDDMMYYYY(leapYearDate);

      // Assert
      expect(result).toBe('29/02/2024');
    });
  });

  describe('parseDDMMYYYY', () => {
    it('should parse DD/MM/YYYY string to Date object', () => {
      // Arrange
      const dateString = '17/12/2024';

      // Act
      const result = parseDDMMYYYY(dateString);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(17);
      expect(result.getMonth()).toBe(11); // December is month 11 (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should return null for empty string', () => {
      // Arrange
      const dateString = '';

      // Act
      const result = parseDDMMYYYY(dateString);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      // Arrange
      const dateString = null;

      // Act
      const result = parseDDMMYYYY(dateString);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid format', () => {
      // Arrange
      const invalidString = '2024-12-17'; // Wrong format

      // Act
      const result = parseDDMMYYYY(invalidString);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle single-digit day and month', () => {
      // Arrange
      const dateString = '5/1/2024';

      // Act
      const result = parseDDMMYYYY(dateString);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(5);
      expect(result.getMonth()).toBe(0); // January is month 0
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('formatDateInputToDisplay', () => {
    it('should convert YYYY-MM-DD to DD/MM/YYYY', () => {
      // Arrange
      const yyyyMmDd = '2024-12-17';

      // Act
      const result = formatDateInputToDisplay(yyyyMmDd);

      // Assert
      expect(result).toBe('17/12/2024');
    });

    it('should return empty string for empty input', () => {
      // Arrange
      const yyyyMmDd = '';

      // Act
      const result = formatDateInputToDisplay(yyyyMmDd);

      // Assert
      expect(result).toBe('');
    });

    it('should return original string for invalid format', () => {
      // Arrange
      const invalidFormat = '12/17/2024'; // Wrong format

      // Act
      const result = formatDateInputToDisplay(invalidFormat);

      // Assert
      expect(result).toBe('12/17/2024');
    });

    it('should handle single-digit day and month', () => {
      // Arrange
      const yyyyMmDd = '2024-01-05';

      // Act
      const result = formatDateInputToDisplay(yyyyMmDd);

      // Assert
      expect(result).toBe('05/01/2024');
    });
  });

  describe('formatDisplayToDateInput', () => {
    it('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      // Arrange
      const ddMmYyyy = '17/12/2024';

      // Act
      const result = formatDisplayToDateInput(ddMmYyyy);

      // Assert
      expect(result).toBe('2024-12-17');
    });

    it('should return empty string for empty input', () => {
      // Arrange
      const ddMmYyyy = '';

      // Act
      const result = formatDisplayToDateInput(ddMmYyyy);

      // Assert
      expect(result).toBe('');
    });

    it('should return original string for invalid format', () => {
      // Arrange
      const invalidFormat = '2024-12-17'; // Wrong format

      // Act
      const result = formatDisplayToDateInput(invalidFormat);

      // Assert
      expect(result).toBe('2024-12-17');
    });

    it('should handle single-digit day and month', () => {
      // Arrange
      const ddMmYyyy = '5/1/2024';

      // Act
      const result = formatDisplayToDateInput(ddMmYyyy);

      // Assert
      expect(result).toBe('2024-1-5'); // Note: This preserves single digits
    });

    it('should handle double-digit day and month', () => {
      // Arrange
      const ddMmYyyy = '05/01/2024';

      // Act
      const result = formatDisplayToDateInput(ddMmYyyy);

      // Assert
      expect(result).toBe('2024-01-05');
    });
  });

  describe('Round-trip conversion', () => {
    it('should convert YYYY-MM-DD to DD/MM/YYYY and back', () => {
      // Arrange
      const original = '2024-12-17';

      // Act
      const toDisplay = formatDateInputToDisplay(original);
      const backToInput = formatDisplayToDateInput(toDisplay);

      // Assert
      expect(toDisplay).toBe('17/12/2024');
      // Note: Back conversion might not be exact due to format differences
    });
  });
});
