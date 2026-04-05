import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#500', margin: '20px', borderRadius: '8px', zIndex: 9999, position: 'relative' }}>
          <h2>Dashboard Crashed!</h2>
          <p style={{ color: '#faa' }}>{this.state.error?.toString()}</p>
          <pre style={{ overflow: 'auto', fontSize: '10px', marginTop: '10px', color: '#ccc' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
