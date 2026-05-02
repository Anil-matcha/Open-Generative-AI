import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, createViMaxStore } from '../../../src/store/ViMaxStore.js';

describe('ViMaxStore', () => {
  let store;

  beforeEach(() => {
    store = createStore({ test: 'initial' });
  });

  describe('Store Creation', () => {
    test('createStore returns store object with state, subscribe, update methods', () => {
      expect(store).toHaveProperty('state');
      expect(store).toHaveProperty('subscribe');
      expect(store).toHaveProperty('update');
    });

    test('store.state returns current state', () => {
      expect(store.state).toEqual({ test: 'initial' });
    });
  });

  describe('Subscription & Updates', () => {
    test('subscribe registers listener and returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);
      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
      // After unsubscribe, updates shouldn't trigger
      store.update({ test: 'new' });
      expect(callback).not.toHaveBeenCalled();
    });

    test('update triggers all subscribers with new state', () => {
      const callback = vi.fn();
      store.subscribe(callback);
      store.update({ test: 'updated' });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ test: 'updated' });
    });

    test('multiple subscribers all receive updates', () => {
      const cb1 = vi.fn(), cb2 = vi.fn();
      store.subscribe(cb1);
      store.subscribe(cb2);
      store.update({ a: 1 });
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Partial State Merging', () => {
    test('update merges partial state into existing state', () => {
      store = createStore({ a: 1, b: 2 });
      store.update({ b: 3 });
      expect(store.state).toEqual({ a: 1, b: 3 });
    });

    test('update replaces state when full object provided', () => {
      store = createStore({ a: 1 });
      store.update({ b: 2 });
      expect(store.state).toEqual({ b: 2 });
    });
  });

  describe('ViMax Initial State Shape', () => {
    test('ViMax store initializes with correct default state shape', () => {
      store = createViMaxStore();
      expect(store.state).toHaveProperty('activeView', 'wizard');
      expect(store.state).toHaveProperty('currentStep', 0);
      expect(store.state).toHaveProperty('formData');
      expect(store.state).toHaveProperty('apiKey', '');
      expect(store.state).toHaveProperty('userId', '');
      expect(store.state).toHaveProperty('userHistory');
      expect(store.state).toHaveProperty('userBatches');
      expect(store.state).toHaveProperty('wsStatus', 'disconnected');
      expect(store.state).toHaveProperty('scenes');
    });
  });

  describe('Wizard Step Navigation', () => {
    test('setCurrentStep action updates currentStep', () => {
      store = createViMaxStore();
      store.update({ currentStep: 2 });
      expect(store.state.currentStep).toBe(2);
    });

    test('canProceedFromContent validates idea2video pipeline', () => {
      store = createViMaxStore({ formData: { pipeline: 'idea2video', idea: 'short' } });
      expect(store.canProceedFromContent()).toBe(false);
      store.update({ formData: { pipeline: 'idea2video', idea: 'This is a long enough idea' } });
      expect(store.canProceedFromContent()).toBe(true);
    });
  });
});
