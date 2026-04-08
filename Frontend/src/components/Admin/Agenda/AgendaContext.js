  import React, { createContext, useState, useContext } from "react";
  import axios from "axios";
  // Create Context
  export const AgendaContext = createContext();

  // Context Provider
  export const AgendaProvider = ({ children }) => {
    const [agendaData, setAgendaData] = useState([]);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const fetchSessions = async (planingId) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/planning-route/session/list`,
          { id: planingId }
        );
        console.log("API Response session/list:", response.data); // Debug the response
        if (response.status === 200) {
          return response.data; // Return session data
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
      return [];
    };
  
    return (
      <AgendaContext.Provider value={{ agendaData, setAgendaData, fetchSessions }}>
        {children}
      </AgendaContext.Provider>
    );
  };
  

  // Custom Hook for using the Context
  export const useAgenda = () => useContext(AgendaContext);
