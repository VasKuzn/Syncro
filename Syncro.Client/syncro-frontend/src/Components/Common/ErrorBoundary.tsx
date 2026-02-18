import React from 'react';
import '../../Styles/Errors.css'

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: any) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught', error, info);
    }

    render() {
        if (this.state.hasError) {
            return <div className="error-display-message">Не удалось отобразить сообщение.</div>;
        }
        return this.props.children as React.ReactElement;
    }
}

export default ErrorBoundary;
