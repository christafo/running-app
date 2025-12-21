import PropTypes from 'prop-types';

/**
 * Reusable Input component with label and error support
 * Replaces inline input styles across the application
 */
export const Input = ({
    label,
    error,
    className = '',
    containerStyle = {},
    ...props
}) => {
    const inputStyles = {
        backgroundColor: '#f1f5f9',
        border: error ? '1px solid #ef4444' : 'none',
        padding: '1rem',
        borderRadius: '0.75rem',
        width: '100%',
        fontSize: '1rem',
        color: 'var(--text-primary)',
        fontWeight: '500'
    };

    const labelStyles = {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
        display: 'block'
    };

    const errorStyles = {
        fontSize: '0.75rem',
        color: '#ef4444',
        marginTop: '0.25rem'
    };

    return (
        <div style={{ ...containerStyle }}>
            {label && <label style={labelStyles}>{label}</label>}
            <input
                style={inputStyles}
                className={className}
                {...props}
            />
            {error && <div style={errorStyles}>{error}</div>}
        </div>
    );
};

Input.propTypes = {
    label: PropTypes.string,
    error: PropTypes.string,
    className: PropTypes.string,
    containerStyle: PropTypes.object
};
