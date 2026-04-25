import React, { createContext, useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../stores';

const StoreContext = createContext(rootStore);

export const StoreProvider = observer(({ children }) => {
  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
});

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

export const useUserStore = () => {
  const { userStore } = useStore();
  return userStore;
};

export const useProjectStore = () => {
  const { projectStore } = useStore();
  return projectStore;
};

export const useVideoEditorStore = () => {
  const { videoEditorStore } = useStore();
  return videoEditorStore;
};