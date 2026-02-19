import { EffectComposer, Vignette, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export function SceneEffects() {
  return (
    <EffectComposer>
      <Vignette darkness={0.7} offset={0.3} />
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
