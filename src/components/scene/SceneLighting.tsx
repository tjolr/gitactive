export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-4, 3, -4]} color="#00ff88" intensity={2} distance={20} />
      <pointLight position={[4, -3, 4]} color="#7c3aed" intensity={2} distance={20} />
      <spotLight
        position={[0, -8, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={1}
        color="#ff6b35"
        distance={20}
      />
    </>
  );
}
