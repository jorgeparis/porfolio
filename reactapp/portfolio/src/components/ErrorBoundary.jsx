// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MonitorPanel Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card meter-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>⚠️ Something went wrong</h3>
          <p>The broadcast monitor encountered an error and has been reset.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;