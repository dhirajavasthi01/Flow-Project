import React, { createContext, useContext, useState, useCallback } from 'react';
import { TextBoxNodeConfig, TextBoxNodeFieldConfig } from './constants';

/**
 * Context for TextBox node configuration and state
 */
const TextBoxContext = createContext(null);

/**
 * Provider component for TextBox context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const TextBoxProvider = ({ children }) => {
    const [nodeConfig] = useState(TextBoxNodeConfig);
    const [fieldConfig] = useState(TextBoxNodeFieldConfig);
    const [selectedTextBoxId, setSelectedTextBoxId] = useState(null);

    const selectTextBox = useCallback((id) => {
        setSelectedTextBoxId(id);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedTextBoxId(null);
    }, []);

    const value = {
        nodeConfig,
        fieldConfig,
        selectedTextBoxId,
        selectTextBox,
        clearSelection,
    };

    return (
        <TextBoxContext.Provider value={value}>
            {children}
        </TextBoxContext.Provider>
    );
};

/**
 * Hook to access TextBox context
 * @returns {Object} TextBox context value
 * @throws {Error} If used outside TextBoxProvider
 */
export const useTextBoxContext = () => {
    const context = useContext(TextBoxContext);
    if (!context) {
        throw new Error('useTextBoxContext must be used within a TextBoxProvider');
    }
    return context;
};

/**
 * Hook to get TextBox node configuration
 * @returns {Object} TextBox node configuration
 */
export const useTextBoxNodeConfig = () => {
    const { nodeConfig } = useTextBoxContext();
    return nodeConfig;
};

/**
 * Hook to get TextBox field configuration
 * @returns {Object} TextBox field configuration
 */
export const useTextBoxFieldConfig = () => {
    const { fieldConfig } = useTextBoxContext();
    return fieldConfig;
};
