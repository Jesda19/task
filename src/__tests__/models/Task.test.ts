/**
 * Tests para el modelo Task
 */

import { TaskEntity } from '../../models/Task';
import { createMockTask, createMockExternalTodoResponse } from '../setup';

describe('TaskEntity', () => {
  describe('constructor', () => {
    it('should create a task with default values', () => {
      const task = new TaskEntity({
        id: '1',
        title: 'Test Task',
        completed: false
      });

      expect(task).toBeValidTask();
      expect(task.id).toBe('1');
      expect(task.title).toBe('Test Task');
      expect(task.completed).toBe(false);
      expect(task.source).toBe('external');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a task with provided values', () => {
      const now = new Date();
      const task = new TaskEntity({
        id: '2',
        title: 'Custom Task',
        completed: true,
        userId: 'user123',
        description: 'Custom description',
        createdAt: now,
        updatedAt: now,
        source: 'firebase'
      });

      expect(task.id).toBe('2');
      expect(task.title).toBe('Custom Task');
      expect(task.completed).toBe(true);
      expect(task.userId).toBe('user123');
      expect(task.description).toBe('Custom description');
      expect(task.createdAt).toBe(now);
      expect(task.updatedAt).toBe(now);
      expect(task.source).toBe('firebase');
    });

    it('should handle partial data gracefully', () => {
      const task = new TaskEntity({});

      expect(task.id).toBe('');
      expect(task.title).toBe('');
      expect(task.completed).toBe(false);
      expect(task.source).toBe('external');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromExternalTodo', () => {
    it('should create TaskEntity from external todo response', () => {
      const externalTodo = createMockExternalTodoResponse({
        id: 123,
        title: 'External Todo',
        completed: true,
        userId: 456
      });

      const task = TaskEntity.fromExternalTodo(externalTodo);

      expect(task).toBeValidTask();
      expect(task.id).toBe('123');
      expect(task.title).toBe('External Todo');
      expect(task.completed).toBe(true);
      expect(task.userId).toBe('456');
      expect(task.source).toBe('external');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle numeric IDs correctly', () => {
      const externalTodo = createMockExternalTodoResponse({
        id: 0,
        userId: 0
      });

      const task = TaskEntity.fromExternalTodo(externalTodo);

      expect(task.id).toBe('0');
      expect(task.userId).toBe('0');
    });
  });

  describe('fromFirebaseDoc', () => {
    it('should create TaskEntity from Firebase document', () => {
      const firebaseData = {
        title: 'Firebase Task',
        completed: false,
        userId: 'fb-user',
        description: 'From Firebase',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') }
      };

      const task = TaskEntity.fromFirebaseDoc('fb-123', firebaseData);

      expect(task).toBeValidTask();
      expect(task.id).toBe('fb-123');
      expect(task.title).toBe('Firebase Task');
      expect(task.completed).toBe(false);
      expect(task.userId).toBe('fb-user');
      expect(task.description).toBe('From Firebase');
      expect(task.source).toBe('firebase');
      expect(task.createdAt).toEqual(new Date('2024-01-01'));
      expect(task.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should handle missing timestamps', () => {
      const firebaseData = {
        title: 'Task without timestamps',
        completed: true,
        userId: 'user'
      };

      const task = TaskEntity.fromFirebaseDoc('doc-id', firebaseData);

      expect(task.id).toBe('doc-id');
      expect(task.title).toBe('Task without timestamps');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle malformed timestamp data', () => {
      const firebaseData = {
        title: 'Task with bad timestamps',
        completed: false,
        createdAt: null,
        updatedAt: undefined
      };

      const task = TaskEntity.fromFirebaseDoc('doc-id', firebaseData);

      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('toFirebaseDoc', () => {
    it('should convert TaskEntity to Firebase document format', () => {
      const task = new TaskEntity(
        createMockTask({
          id: 'task-123',
          title: 'Convert Task',
          completed: true,
          userId: 'user-456',
          description: 'Task to convert'
        })
      );

      const firebaseDoc = task.toFirebaseDoc();

      expect(firebaseDoc).toEqual({
        title: 'Convert Task',
        completed: true,
        userId: 'user-456',
        description: 'Task to convert',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });

      // El ID no debe estar en el documento de Firebase
      expect(firebaseDoc.id).toBeUndefined();
      expect(firebaseDoc.source).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const task = new TaskEntity({
        id: '1',
        title: 'Minimal Task',
        completed: false
      });

      const firebaseDoc = task.toFirebaseDoc();

      expect(firebaseDoc.title).toBe('Minimal Task');
      expect(firebaseDoc.completed).toBe(false);
      expect(firebaseDoc.userId).toBeUndefined();
      expect(firebaseDoc.description).toBeUndefined();
      expect(firebaseDoc.createdAt).toBeInstanceOf(Date);
      expect(firebaseDoc.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('validation', () => {
    it('should validate task structure with custom matcher', () => {
      const validTask = createMockTask();
      const invalidTask = { title: 'Missing fields' };

      expect(validTask).toHaveValidTaskStructure();
      expect(invalidTask).not.toHaveValidTaskStructure();
    });

    it('should be a valid task with custom matcher', () => {
      const validTask = createMockTask();
      const invalidTask = { id: 123, title: 'Invalid ID type' };

      expect(validTask).toBeValidTask();
      expect(invalidTask).not.toBeValidTask();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const task = new TaskEntity({
        id: '',
        title: '',
        completed: false
      });

      expect(task.id).toBe('');
      expect(task.title).toBe('');
      expect(task.completed).toBe(false);
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Task with émojis 🚀 and ñoñérías & symbols!';
      const task = new TaskEntity({
        id: '1',
        title: specialTitle,
        completed: false
      });

      expect(task.title).toBe(specialTitle);
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(10000);
      const task = new TaskEntity({
        id: '1',
        title: 'Long Description Task',
        completed: false,
        description: longDescription
      });

      expect(task.description).toBe(longDescription);
      expect(task.description?.length).toBe(10000);
    });

    it('should maintain data integrity across transformations', () => {
      const originalTask = createMockTask({
        title: 'Integrity Test',
        description: 'Original description'
      });

      // Convertir a Firebase y de vuelta
      const firebaseDoc = originalTask.toFirebaseDoc();
      const recreatedTask = TaskEntity.fromFirebaseDoc('same-id', firebaseDoc);

      expect(recreatedTask.title).toBe(originalTask.title);
      expect(recreatedTask.description).toBe(originalTask.description);
      expect(recreatedTask.completed).toBe(originalTask.completed);
      expect(recreatedTask.userId).toBe(originalTask.userId);
    });
  });
});
