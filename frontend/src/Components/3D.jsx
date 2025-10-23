import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress, Html } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { Color } from "three";

const TankParts = ({leakage}) => {
  const { scene, error } = useGLTF("/tank3D.glb");
  const { progress } = useProgress();

  useEffect(() => {
  return () => {
    useGLTF.clear("/tank3D.glb");
  };
}, []);

  if (progress < 100) {
    return (
      <Html center>
        <div style={{ color: "black", padding: "20px", background: "rgba(255,255,255,0.8)", borderRadius: "10px" }}>
          Loading tank model... {Math.round(progress)}%
        </div>
      </Html>
    );
  }

  if (error) {
    console.error("Failed to load tank model:", error);
    return (
      <Html center>
        <div style={{ color: "red" }}>Error loading model</div>
      </Html>
    );
  }

  if (!scene) return null;

  const parts = useMemo(() => ({
    object005: scene.getObjectByName("Object005"),
    sphere: scene.getObjectByName("Sphere"),
    cube: scene.getObjectByName("Cube"),
    object001: scene.getObjectByName("Object001"),
    cube001: scene.getObjectByName("Cube001"),
    object: scene.getObjectByName("Object"),
    cylinder001: scene.getObjectByName("Cylinder001"),
    cylinder: scene.getObjectByName("Cylinder"),
  }), [scene]);

  const colorTank = new Color(
    leakage?.detected && leakage.location === "tank" ? "red" : "lime"
  );
  const colorPipe = new Color(
    leakage?.detected && leakage.location === "pipe" ? "red" : "lime"
  );

  // 🔹 Change colors
  if (parts.object001?.material) {
    //tank body
    parts.object001.material = parts.object001.material.clone();
    parts.object001.material.color = colorTank || new Color("lime");
  }

  if (parts.cylinder001?.material) {
    //tank base
    parts.cylinder001.material = parts.cylinder001.material.clone();
    parts.cylinder001.material.color = colorTank || new Color("lime");
  }

  if (parts.cylinder?.material ) {
    //pipe
    parts.cylinder.material = parts.cylinder.material.clone();
    parts.cylinder.material.color = colorPipe || new Color("lime");
  }

  return (
    <>
      {parts.object001 && <primitive object={parts.object001} position={[0, 0, 0]} />}
      {parts.cylinder001 && <primitive object={parts.cylinder001} position={[0, -0.4, 0]} />}
      {parts.cylinder && <primitive object={parts.cylinder} position={[1, 1, 0]} />}
    </>
  );
};

const ModelViewer = ({leakage}) => (
  <Canvas
    style={{
      width: "100%",
      height: "70vh",
      background: "#f0f0f0",
      marginTop: "20px",
      borderRadius: "10px",
    }}
    camera={{ position: [3, 3, 7], fov: 40 }}
  >
    <ambientLight intensity={1} />
    <directionalLight position={[5, 5, 5]} intensity={2.5} />
    <TankParts leakage = {leakage}/>
    <OrbitControls />
  </Canvas>
);

export default ModelViewer;
