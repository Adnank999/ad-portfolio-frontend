import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  prefersLightweightGraphics,
  scheduleAfterPageLoad,
} from "@/lib/deferred-work";
import { brandMarkPath } from "./brand-mark";
import "./brand-logo.css";

const ElectricLogo = lazy(() => import("../electric-logo/ElectricLogo"));

class LogoBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function BrandLogo() {
  const element = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const painted = useRef(false);
  const onRender = useCallback(() => {
    if (!painted.current) {
      painted.current = true;
      setReady(true);
    }
  }, []);
  const onFailure = useCallback(() => {
    painted.current = false;
    setReady(false);
    setRequested(false);
  }, []);

  useEffect(() => {
    const target = element.current?.closest("a") ?? element.current;
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interested = false;
    let cancel: (() => void) | undefined;
    const update = () => {
      cancel?.();
      if (!interested || reduced.matches || prefersLightweightGraphics()) {
        setRequested(false);
        onFailure();
      } else cancel = scheduleAfterPageLoad(() => setRequested(true));
    };
    const enter = (event: Event) => {
      if (event instanceof PointerEvent && event.pointerType === "touch")
        return;
      interested = true;
      update();
    };
    const leave = () => {
      if (target.matches(":focus-visible")) return;
      interested = false;
      update();
    };
    update();
    target.addEventListener("pointerenter", enter);
    target.addEventListener("pointerleave", leave);
    target.addEventListener("focus", enter);
    target.addEventListener("blur", leave);
    reduced.addEventListener("change", update);
    return () => {
      cancel?.();
      target.removeEventListener("pointerenter", enter);
      target.removeEventListener("pointerleave", leave);
      target.removeEventListener("focus", enter);
      target.removeEventListener("blur", leave);
      reduced.removeEventListener("change", update);
    };
  }, [onFailure]);

  return (
    <div
      ref={element}
      className="brand-logo"
      data-logo-ready={requested && ready}
      aria-hidden="true"
    >
      <svg
        className="brand-logo-still"
        viewBox="0 0 512 512"
        fill="currentColor"
        focusable="false"
      >
        <path d={brandMarkPath} />
      </svg>

      {requested && (
        <div className="brand-logo-effect">
          <LogoBoundary onFailure={onFailure}>
            <Suspense fallback={null}>
              <ElectricLogo
                src="/logo.svg"
                color="#C21E56"
                glowColor="#C21E56"
                scale={0.65}
                strands={4}
                bend={0.6}
                crackle={1.5}
                arcs={1}
                speed={2.5}
                intensity={0.4}
                glow={1}
                thickness={0.1}
                flicker={1}
                fill={0}
                rasterSize={128}
                maxFps={30}
                maxDpr={1}
                introDuration={0}
                onRender={onRender}
                onUnavailable={onFailure}
              />
            </Suspense>
          </LogoBoundary>
        </div>
      )}
    </div>
  );
}
