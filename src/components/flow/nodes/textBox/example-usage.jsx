/**
 * Example usage of the TextBox utilities, components, and context
 * 
 * This file demonstrates how to use the refactored TextBox code
 * that has been separated into constants, utils, components, and context.
 */

// Import everything from the textBox module
import {
    // Constants
    TextBoxNodeFieldConfig,
    TextBoxNodeConfig,
    // Utility functions
    findBestMatchingNode,
    calculateOptimalFontSize,
    formatTextContent,
    getRawText,
    calculateAngle,
    // Components
    TextContent,
    RotateHandle,
    // Context
    TextBoxProvider,
    useTextBoxContext,
    useTextBoxNodeConfig,
    useTextBoxFieldConfig,
} from './index';

// Example: Using the context in a component
const ExampleTextBoxComponent = () => {
    const { nodeConfig, fieldConfig, selectTextBox } = useTextBoxContext();
    
    return (
        <div>
            {/* Use components */}
            <TextContent 
                textRef={null}
                content="Example"
                color="#000000"
                label="Label"
                fontSize={16}
            />
            <RotateHandle onMouseDown={() => {}} />
        </div>
    );
};

// Example: Wrapping your app with the provider
const App = () => {
    return (
        <TextBoxProvider>
            <ExampleTextBoxComponent />
        </TextBoxProvider>
    );
};

export default App;
