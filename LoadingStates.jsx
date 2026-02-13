import React from 'react';
import { Loader2 } from 'lucide-react';

// Loading states for different contexts
const LoadingStates = {
  // Full page loading
  FullPage: ({ message = 'Loading...', size = 'medium' }) => {
    const sizeClasses = {
      small: '24px',
      medium: '48px',
      large: '64px'
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{ 
          width: sizeClasses[size], 
          height: sizeClasses[size], 
          position: 'relative'
        }}>
          <div 
            className="animate-spin"
            style={{
              width: '100%',
              height: '100%',
              border: '3px solid var(--border-color)',
              borderTop: '3px solid var(--primary-color)',
              borderRadius: '50%'
            }}
          />
          <Loader2 
            size={size === 'small' ? 16 : size === 'medium' ? 24 : 32}
            color="var(--primary-color)"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {message}
        </p>
      </div>
    );
  },

  // Component/card loading
  Card: ({ height = '200px' }) => (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      borderRadius: 'var(--radius-xl)',
      height: height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <div 
          className="animate-spin"
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--border-color)',
            borderTop: '2px solid var(--primary-color)',
            borderRadius: '50%'
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading...
        </span>
      </div>
    </div>
  ),

  // Table row loading
  TableRow: ({ rows = 5, columns = 4 }) => (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} style={{ padding: 'var(--spacing-lg)' }}>
              <div 
                className="animate-pulse"
                style={{
                  height: '20px',
                  background: 'linear-gradient(90deg, var(--glass-bg) 0%, var(--secondary-color) 50%, var(--glass-bg) 100%)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }}
              />
            </td>
          ))}
        </tr>
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  ),

  // Button loading
  Button: ({ children, disabled = false }) => (
    <button 
      className="btn btn-primary"
      disabled={disabled || true}
      style={{ 
        opacity: 0.7,
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)'
      }}
    >
      <div 
        className="animate-spin"
        style={{
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%'
        }}
      />
      {children}
    </button>
  ),

  // Small inline loading
  Inline: ({ message = 'Loading...', size = 'small' }) => {
    const sizes = {
      small: 16,
      medium: 20,
      large: 24
    };

    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 'var(--spacing-xs)',
        color: 'var(--text-muted)'
      }}>
        <Loader2 
          size={sizes[size]} 
          className="animate-spin" 
        />
        {message}
      </span>
    );
  }
};

// Named exports for easy importing
export const FullPageLoading = LoadingStates.FullPage;
export const CardLoading = LoadingStates.Card;
export const TableRowLoading = LoadingStates.TableRow;
export const ButtonLoading = LoadingStates.Button;
export const InlineLoading = LoadingStates.Inline;

// Default export
export default LoadingStates;