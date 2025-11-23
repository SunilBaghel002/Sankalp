// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4 text-red-500">
                            Something went wrong
                        </h1>
                        <p className="text-slate-400 mb-4">
                            {this.state.error?.message || "Unknown error"}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-orange-500 px-4 py-2 rounded-lg"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;