import React from 'react';

/**
 * TextContent component for displaying text in TextBox nodes
 * @param {Object} props - Component props
 * @param {React.Ref} props.textRef - Ref to the text element
 * @param {string} props.content - HTML content to display
 * @param {string} props.color - Text color
 * @param {string} props.label - Label text (used for conditional styling)
 * @param {number} props.fontSize - Font size in pixels
 */
export const TextContent = ({ textRef, content, color, label, fontSize }) => (
    <p
        ref={textRef}
        onMouseDown={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
            color: label.toLowerCase().includes("header") ? "red" : color,
            textAlign: "center",
            fontSize: `${fontSize}px`,
            margin: 0,
            padding: 0,
            fontWeight: 'bold',
            lineHeight: '1.2',
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}
        className="text-uppercase"
    />
);

/**
 * RotateHandle component for rotating TextBox nodes
 * @param {Object} props - Component props
 * @param {Function} props.onMouseDown - Mouse down handler for rotation
 */
export const RotateHandle = ({ onMouseDown }) => (
    <div
        className="rotate-handle nodrag"
        onMouseDown={onMouseDown}
        style={{
            position: 'absolute',
            top: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#0098cfff',
            cursor: 'grab',
            zIndex: 10,
            border: '2px solid white',
        }}
    >
        <div style={{ color: 'white', fontSize: '14px', textAlign: 'center', lineHeight: '18px' }}>
            ↻
        </div>
    </div>
);
