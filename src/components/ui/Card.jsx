
/**
 * Reusable Card component with consistent styling
 * Replaces inline card styles across the application
 */
export const Card = ({ children, className = '', style = {}, ...props }) => {
    const baseStyles = {
        backgroundColor: 'white',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        ...style
    };

    return (
        <div
            style={baseStyles}
            className={`card ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

