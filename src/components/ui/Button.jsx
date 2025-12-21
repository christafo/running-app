import PropTypes from 'prop-types';

/**
 * Reusable Button component with consistent styling
 * Replaces inline button styles across the application
 */
export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const baseStyles = {
        borderRadius: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    };

    const variants = {
        primary: {
            backgroundColor: '#eff6ff',
            color: 'var(--primary-color)',
            border: '2px solid var(--primary-color)'
        },
        secondary: {
            backgroundColor: '#f1f5f9',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
        },
        danger: {
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
        }
    };

    const sizes = {
        sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
        md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
        lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }
    };

    const combinedStyles = {
        ...baseStyles,
        ...variants[variant],
        ...sizes[size]
    };

    return (
        <button
            style={combinedStyles}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
};

Button.propTypes = {
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};
