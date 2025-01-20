import { trace, context, ContextManager, TextMapPropagator, Tracer, Span } from '@opentelemetry/api'

class NoOpTracer implements Tracer {
  startSpan(spanName: string, options?: any, context?: any): Span {
    return new NoOpSpan()
  }

  startActiveSpan<F extends (span: Span) => ReturnType<F>>(
    name: string,
    fn: F,
    options?: any,
    context?: any
  ): ReturnType<F> {
    // If a callback function (fn) is provided for an active span, execute it directly
    // without any tracing context.
    return fn(new NoOpSpan() as Span)
  }
}

// NoOpSpan class
class NoOpSpan implements Span {
  addEvent(name: string, attributes?: any, timestamp?: number): this {
    return this
  }
  
  addLink(spanContext: any, attributes?: any): this {
    return this
  }

  addLinks(links: any[]): this {
    return this
  }
  end(endTime?: number): void {
    // Do nothing
  }
  setAttribute(key: string, value: unknown): this {
    return this
  }
  setAttributes(attributes: any): this {
    return this
  }
  setStatus(status: any): this {
    return this
  }
  updateName(name: string): this {
    return this
  }
  isRecording(): boolean {
    return false
  }
  recordException(exception: any, time?: any): void {
    // Do nothing
  }
  spanContext(): any {
    return {}
  }
}

export default NoOpTracer