"use client";

/**
 * Client Error Boundary — soft fail, never leak internals.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import type { FailClosedVariant } from "@/lib/fail-closed/constants";

type FailClosedBoundaryProps = {
  children: ReactNode;
  variant?: FailClosedVariant;
  density?: "page" | "section";
  onReset?: () => void;
};

type FailClosedBoundaryState = {
  hasError: boolean;
};

export class FailClosedBoundary extends Component<
  FailClosedBoundaryProps,
  FailClosedBoundaryState
> {
  state: FailClosedBoundaryState = { hasError: false };

  static getDerivedStateFromError(): FailClosedBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no user-facing logging of message/stack.
    void _error;
    void _info;
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <FailClosedPanel
          variant={this.props.variant}
          density={this.props.density ?? "section"}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
