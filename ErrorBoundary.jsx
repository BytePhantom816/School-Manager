import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    background: '#1e293b',
                    color: '#f8fafc',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong.</h1>
                    <div style={{
                        background: '#0f172a',
                        padding: '1rem',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '800px',
                        overflowX: 'auto',
                        border: '1px solid #334155'
                    }}>
                        <pre style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <pre style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '1rem' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
