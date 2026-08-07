// src/three/ViewerScene.jsx
// The model + lighting shown inside ProductViewer's <Canvas>. Renders a
// procedural furniture model matched to the product's category, in the chosen
// finish. Kept in its own lazy chunk so `three` only loads when a viewer mounts.

import { Environment, ContactShadows } from '@react-three/drei';
import FurnitureModel, { FLOOR } from './Furniture';

export default function ViewerScene({ finishKey = 'walnut', modelType = 'table', envResolution = 128 }) {
  return (
    <>
      <color attach="background" args={['#efeadf']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.8} color={'#fff0d6'} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.55} color={'#aeb8c6'} />

      <FurnitureModel type={modelType} finishKey={finishKey} />

      {envResolution > 0 && <Environment preset="apartment" resolution={envResolution} />}
      <ContactShadows position={[0, FLOOR - 0.01, 0]} opacity={0.42} scale={7} blur={2.4} far={3} />
    </>
  );
}
