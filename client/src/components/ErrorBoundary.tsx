import * as React from 'react';

export class ErrorBoundary extends React.Component<{fallback?: React.ReactNode},{hasError:boolean}> {
  constructor(p:any){ 
    super(p); 
    this.state={hasError:false}; 
  }
  
  static getDerivedStateFromError(){ 
    return {hasError:true}; 
  }
  
  componentDidCatch(e:any, info:any){ 
    console.error('ErrorBoundary caught an error:', e, info); 
  }
  
  render(){ 
    return this.state.hasError 
      ? (this.props.fallback ?? <div className="p-4 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">Something went wrong.</div>) 
      : this.props.children; 
  }
}