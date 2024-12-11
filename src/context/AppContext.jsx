import React, { createContext, useState } from "react";

// Create the context
export const AppContext = createContext();

// Create a provider component
export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    savedTweets: [],
    tags: [],
    isDebug: false,
  });

  const updateState = (key, value) => {
    setState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return (
    <AppContext.Provider value={{ state, updateState }}>
      {children}
    </AppContext.Provider>
  );
};
