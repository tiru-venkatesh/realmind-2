// frontend/src/components/blender/ModelViewer.jsx
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

function Model({ url }) {
  const obj = useLoader(OBJLoader, url);
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.3; });
  return <primitive ref={ref} object={obj} scale={1} />;
}

function OBJFromString({ objText }) {
  const loader = new OBJLoader();
  const obj = loader.parse(objText);
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.3; });
  return <primitive ref={ref} object={obj} scale={1} />;
}

export default function ModelViewer({ objText, objUrl }) {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-sand-200 bg-sand-50">
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }} shadows>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Suspense fallback={null}>
          {objText && <OBJFromString objText={objText} />}
          {objUrl && <Model url={objUrl} />}
          <Environment preset="studio" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={10} fadeStrength={2} />
        <OrbitControls makeDefault autoRotate={false} />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}