'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { Cylinder, PerspectiveCamera, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import logoF from '../../assets/images/tapnsf.png'
import logoB from '../../assets/images/tapnsb.png'


function Coin() {
  const meshRef = useRef<THREE.Mesh>(null!)

  const frontMaterial = new THREE.MeshStandardMaterial({
    map: useLoader(TextureLoader, logoF.src),
    side: THREE.FrontSide,
  })

  const backMaterial = new THREE.MeshStandardMaterial({
    map: useLoader(TextureLoader, logoB.src),
    side: THREE.BackSide,
  })

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 'white',
    side: THREE.DoubleSide,
  })

  useFrame((state, delta) => {
    meshRef.current.rotation.y -= delta
  })

  return (
    <group ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={new THREE.CylinderGeometry(1.8, 1.8, 0.05, 50)} material={frontMaterial}
            position={[0, 0.03, 0]}/>
      <mesh geometry={new THREE.CylinderGeometry(1.8, 1.8, 0.05, 50)} material={backMaterial}
            position={[0, -0.03, 0]}/>
      <mesh geometry={new THREE.CylinderGeometry(1.8, 1.8, 0.1, 50, 1, true)} material={edgeMaterial}/>
    </group>
  )
}

function Pedestal() {
  return (
    <Cylinder args={[1.2, 1.5, 0.5, 32]} position={[0, 0.25, 0]}>
      <meshStandardMaterial color="gray"/>
    </Cylinder>
  )
}

function Light() {
  return (
    <>
      <ambientLight intensity={0.5}/>
      <pointLight position={[10, 10, 10]} intensity={1}/>
      <pointLight position={[-10, -10, -10]} intensity={0.5}/>
    </>
  )
}

export default function RotatingCoin() {
  return (
    <div className="w-full aspect-square">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableZoom={false} enableRotate={false}/>
        <Light />
        <Coin />
        {/* <Pedestal /> */}
      </Canvas>
    </div>
  )
}