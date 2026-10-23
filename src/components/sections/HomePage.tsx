import { lazy, startTransition, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  MotionConfig,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTime,
} from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useHomeMedia } from "@/components/home/hooks/useHomeMedia";
import {
  useSectionProgress,
} from "@/components/home/hooks/useCinematicMotion";
import { CinematicAbout } from "@/components/home/cinematic/CinematicAbout";
import { CinematicCapabilities } from "@/components/home/cinematic/CinematicCapabilities";
import { CinematicContact } from "@/components/home/cinematic/CinematicContact";
import { CinematicExperiment } from "@/components/home/cinematic/CinematicExperiment";
import { CinematicHero } from "@/components/home/cinematic/CinematicHero";
import { CinematicProcess } from "@/components/home/cinematic/CinematicProcess";
import { SceneBoundary } from "@/components/home/SceneBoundary";
import { prefersLightweightGraphics, scheduleAfterPageLoad } from '@/lib/deferred-work';
import "@/styles/homepage.css";
import "@/components/home/shaders-glsl/hero.css";
import { useHeroShaderControls } from "@/components/home/shaders-glsl/ShaderControls";

const CinematicCanvas = lazy(() => import("@/components/home/CinematicCanvas"));

export function HomePage() {
  const mainRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const capabilitiesRef = useRef<HTMLElement>(null);
  const experimentRef = useRef<HTMLElement>(null);
  const { compact, shortViewport, mounted, reducedMotion: motionPreference } = useHomeMedia();
  const reducedMotion = mounted && motionPreference;
  const [effectsPaused, setEffectsPaused] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [sceneRequested, setSceneRequested] = useState(false);
  const heroControls = useHeroShaderControls();
  const onUnavailable = useCallback(() => setSceneUnavailable(true), []);
  const staticLayout = reducedMotion || shortViewport;
  const still = !mounted || staticLayout;
  const reveal = useSectionProgress(aboutRef, true);
  const reverse = useSectionProgress(capabilitiesRef, true);
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    if (prefersLightweightGraphics()) { setSceneUnavailable(true); return; }
    return scheduleAfterPageLoad(() => startTransition(() => setSceneRequested(true)));
  }, [mounted, reducedMotion]);
  const heroProgress = useSectionProgress(heroRef);
  const experimentProgress = useSectionProgress(experimentRef);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const burstTarget = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 75, damping: 24 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 75, damping: 24 });
  const burst = useSpring(burstTarget, { stiffness: 55, damping: 16 });
  const time = useTime();
  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"],
  });

  return (
    <MotionConfig reducedMotion="user">
      <main
        ref={mainRef}
        className="cinema-home"
        data-hero-ready={heroReady && !sceneUnavailable}
        data-reduced-motion={reducedMotion}
        data-static-layout={staticLayout}
        data-scene-fallback={sceneUnavailable || staticLayout}
        data-motion-paused={effectsPaused}
      >
        <noscript>
          <style>{`.cinema-home .cinema-transition,.cinema-home .cinema-process,.cinema-home .cinema-work{height:auto}.cinema-home .cinema-sticky{position:relative;height:auto}.cinema-home .cinema-transition-thought,.cinema-home .cinema-process-navigation,.cinema-home .cinema-process-progress,.cinema-home .cinema-work-controls{display:none}.cinema-home .cinema-process-stage{display:flex;flex-direction:column;gap:60px;padding-block:50px}.cinema-home .cinema-process-step{position:relative}.cinema-home .cinema-project-track{display:grid;grid-template-columns:1fr;width:auto}.cinema-home .cinema-project-card{width:100%}`}</style>
        </noscript>
        <Link className="cinema-skip" to="/projects">
          Browse all work
        </Link>
        {mounted && !reducedMotion && !sceneUnavailable && sceneRequested && (
          <SceneBoundary onError={onUnavailable}>
            <Suspense fallback={null}>
              <CinematicCanvas
                heroControls={heroControls}
                onHeroReady={setHeroReady}
                onUnavailable={onUnavailable}
                reveal={reveal}
                reverse={reverse}
                heroProgress={heroProgress}
                experimentProgress={experimentProgress}
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                burst={burst}
                time={time}
                compact={compact || shortViewport}
                still={reducedMotion || effectsPaused}
                staticLayout={staticLayout}
                heroRef={heroRef}
                experimentRef={experimentRef}
              />
            </Suspense>
          </SceneBoundary>
        )}
        <motion.div
          className="cinema-page-progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
        {/*<button
          className="cinema-effects"
          type="button"
          onClick={() => setEffectsPaused(!effectsPaused)}
          aria-pressed={effectsPaused}
          disabled={staticLayout}
        >
          {still || effectsPaused ? (
            <Play size={13} aria-hidden="true" />
          ) : (
            <Pause size={13} aria-hidden="true" />
          )}
          {reducedMotion
            ? "Reduced motion"
            : shortViewport
              ? "Compact view"
              : effectsPaused
                ? "Resume ambient motion"
                : "Pause ambient motion"}
        </button>*/}
        <CinematicHero sectionRef={heroRef} still={still} />
        <CinematicAbout sectionRef={aboutRef} progress={reveal} still={still} />
        <CinematicProcess still={still} />
        <CinematicCapabilities
          sectionRef={capabilitiesRef}
          still={still}
        />
        <CinematicExperiment
          sectionRef={experimentRef}
          pointerX={pointerX}
          pointerY={pointerY}
          burst={burstTarget}
          still={!mounted || reducedMotion}
        />
        <CinematicContact still={!mounted || reducedMotion} />
      </main>
    </MotionConfig>
  );
}
