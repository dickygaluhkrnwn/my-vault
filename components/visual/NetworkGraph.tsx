"use client"

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sparkles, Text, Billboard, QuadraticBezierLine } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Account, AccountCategory } from '../../lib/types/schema' 

// --- TYPES LOCAL ---
interface ConnectedNode extends Account {
    connectionPath?: string;
    depth?: number;
    immediateParentId?: string;
    isSmartLinked?: boolean;
}

interface ConnectionGroup {
  parentId: string;
  rootAccount?: Account;
  children: ConnectedNode[];
}

interface NetworkGraphProps {
  group?: ConnectionGroup;
  onNodeClick?: (node: Account) => void;
}

// Interface untuk Node Fisika
interface PhysicsNode {
    id: string;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    data: Account;
    isRoot: boolean;
    radius: number; // Besar node untuk perhitungan tabrakan
}

interface PhysicsLink {
    source: string;
    target: string;
    color: string;
}

// --- HELPER: WARNA KATEGORI ---
const getCategoryColor = (category: AccountCategory | string): string => {
  switch (category) {
    case "GAME": return "#a855f7"; 
    case "FINANCE": return "#10b981"; 
    case "SOCIAL": return "#3b82f6"; 
    case "WORK": return "#f59e0b"; 
    case "UTILITY": return "#f97316"; 
    case "ENTERTAINMENT": return "#ec4899"; 
    case "EDUCATION": return "#eab308"; 
    case "ECOMMERCE": return "#f43f5e"; 
    default: return "#6366f1"; 
  }
};

// --- KOMPONEN: ORGANIC CELL (BAKTERI/NEURON) ---
function OrganicNode({ position, color, scale = 1, label, onClick }: { position: [number, number, number], color: string, scale?: number, label?: string, onClick?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
        meshRef.current.rotation.x = t * 0.2
        meshRef.current.rotation.y = t * 0.3
    }
    if (glowRef.current) {
        glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05)
    }
  })

  const handleClick = (e: any) => {
      e.stopPropagation(); 
      if (onClick) onClick();
  }

  return (
    <group position={position} onClick={handleClick}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        
        {/* Inti Sel */}
        <mesh ref={glowRef} scale={scale * 0.3}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
        </mesh>

        {/* Sitoplasma */}
        <Sparkles count={15} scale={scale * 0.8} size={3} speed={0.2} opacity={0.6} color="#ffffff" noise={1} />

        {/* Membran Luar */}
        <mesh 
            ref={meshRef} 
            scale={hovered ? scale * 1.3 : scale}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                color={hovered ? "#ffffff" : color} 
                attach="material"
                distort={0.3} 
                speed={1.5} 
                roughness={0.4} 
                metalness={0.1}
                transmission={0.6} 
                thickness={0.5}
                opacity={0.5} 
                transparent={true}
            />
        </mesh>

        {/* Tekstur Kulit */}
        <points scale={hovered ? scale * 1.32 : scale * 1.02}>
            <sphereGeometry args={[1, 32, 32]} />
            <pointsMaterial 
                color={hovered ? "#ffffff" : color}
                size={0.03}
                transparent
                opacity={0.3}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
            />
        </points>

        {/* Smart Label + Billboard */}
        {label && (
            <Billboard
                position={[0, scale + 0.6, 0]} 
                follow={true} 
                lockX={false} lockY={false} lockZ={false}
            >
                <Text
                    fontSize={hovered ? 0.4 : 0.25} 
                    color={hovered ? "#22d3ee" : "#e2e8f0"} 
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.02}
                    outlineColor="#020617" 
                    fillOpacity={hovered ? 1 : 0.6} 
                    characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?"
                >
                    {label}
                </Text>
            </Billboard>
        )}

      </Float>
    </group>
  )
}

// --- KOMPONEN: SINYAL SARAF (IMPULSE) ---
function NeuralImpulse({ curve, color, speed }: { curve: THREE.QuadraticBezierCurve3, color: string, speed: number }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    
    useFrame((state) => {
        // [TUNING] Kecepatan global dikurangi (multiplier 0.3) agar tidak terlalu aktif
        const t = (state.clock.getElapsedTime() * speed * 0.3) % 1
        const pos = curve.getPoint(t) 
        if (meshRef.current) {
            meshRef.current.position.copy(pos)
        }
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.6} />
        </mesh>
    )
}

// --- KOMPONEN: KONEKSI SINAPSA (DENDRIT) ---
function Synapse({ start, end, color = "#ffffff" }: { start: [number, number, number], end: [number, number, number], color?: string }) {
    const { curve, mid } = useMemo(() => {
        const vStart = new THREE.Vector3(...start)
        const vEnd = new THREE.Vector3(...end)
        const vMid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5)
        const dist = vStart.distanceTo(vEnd)
        
        // [TUNING] Curvature dikurangi agar garis tidak terlalu melengkung jauh
        const curvature = dist * 0.15 
        
        // Offset acak yang lebih halus
        const offset = new THREE.Vector3(
            (Math.random() - 0.5), 
            (Math.random() - 0.5), 
            (Math.random() - 0.5)
        ).normalize().multiplyScalar(curvature);
        
        vMid.add(offset);

        const curveObj = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd)
        return { curve: curveObj, mid: vMid }
    }, [start, end])

    // [TUNING] Range kecepatan dikurangi (0.2 - 0.7)
    const speed = useMemo(() => 0.2 + Math.random() * 0.5, [])

    return (
        <group>
            <QuadraticBezierLine
                start={new THREE.Vector3(...start)}
                end={new THREE.Vector3(...end)}
                mid={mid}
                color={color}
                lineWidth={0.8} // Lebih tipis
                transparent
                opacity={0.1} // Lebih transparan
            />
            <NeuralImpulse curve={curve} color={color} speed={speed} />
        </group>
    )
}

// --- SCENE UTAMA DENGAN FORCE-DIRECTED LAYOUT ---
function Scene({ group, onNodeClick }: { group?: ConnectionGroup, onNodeClick?: (node: Account) => void }) {
  
  // ALGORITMA SIMULASI FISIKA 3D
  const { nodes, links } = useMemo(() => {
    if (!group) return { nodes: [], links: [] };

    // 1. Inisialisasi Node
    const physicsNodes: PhysicsNode[] = [];
    const physicsLinks: PhysicsLink[] = [];

    // Root Node
    if (group.rootAccount) {
        physicsNodes.push({
            id: group.rootAccount.id,
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            data: group.rootAccount,
            isRoot: true,
            radius: 4 
        });
    }

    // Child Nodes
    group.children.forEach(child => {
        // Spawn posisi awal tidak terlalu jauh (range 5 instead of 10)
        physicsNodes.push({
            id: child.id,
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5,
            z: (Math.random() - 0.5) * 5,
            vx: 0, vy: 0, vz: 0,
            data: child,
            isRoot: false,
            radius: 2.5 
        });

        const parentId = child.immediateParentId || group.rootAccount?.id;
        if (parentId) {
            physicsLinks.push({
                source: parentId,
                target: child.id,
                color: getCategoryColor(child.category)
            });
        }
    });

    // 2. SIMULASI FISIKA
    const iterations = 300;
    
    // [TUNING PHYSICS] Parameter agar node lebih rapat & stabil
    const repulsionStrength = 60; // Dikurangi (biar ga tolak-menolak terlalu jauh)
    const springLength = 5;       // Jarak ideal diperpendek
    const springStrength = 0.1;   // Tarikan diperkuat
    const centerPull = 0.03;      // Gravitasi ke tengah diperkuat (biar ga kabur)

    for (let i = 0; i < iterations; i++) {
        // A. Repulsion
        for (let j = 0; j < physicsNodes.length; j++) {
            for (let k = j + 1; k < physicsNodes.length; k++) {
                const n1 = physicsNodes[j];
                const n2 = physicsNodes[k];
                
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const dz = n1.z - n2.z;
                const distSq = dx*dx + dy*dy + dz*dz || 1; 
                const dist = Math.sqrt(distSq);

                if (dist < (n1.radius + n2.radius) * 3) { 
                    const force = repulsionStrength / distSq;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    const fz = (dz / dist) * force;

                    if (!n1.isRoot) { n1.vx += fx; n1.vy += fy; n1.vz += fz; }
                    if (!n2.isRoot) { n2.vx -= fx; n2.vy -= fy; n2.vz -= fz; }
                }
            }
        }

        // B. Spring
        physicsLinks.forEach(link => {
            const source = physicsNodes.find(n => n.id === link.source);
            const target = physicsNodes.find(n => n.id === link.target);
            
            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dz = target.z - source.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                const force = (dist - springLength) * springStrength;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                const fz = (dz / dist) * force;

                if (!source.isRoot) { source.vx += fx; source.vy += fy; source.vz += fz; }
                if (!target.isRoot) { target.vx -= fx; target.vy -= fy; target.vz -= fz; }
            }
        });

        // C. Center Pull
        physicsNodes.forEach(node => {
            if (node.isRoot) return; 

            node.vx -= node.x * centerPull;
            node.vy -= node.y * centerPull;
            node.vz -= node.z * centerPull;

            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;

            node.vx *= 0.9;
            node.vy *= 0.9;
            node.vz *= 0.9;
        });
    }

    return { nodes: physicsNodes, links: physicsLinks };

  }, [group]); 

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />

      <EffectComposer>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.2} radius={0.5} />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={[20, 20, 20]} size={1.5} speed={0.1} opacity={0.3} color="#ffffff" />

      <group>
        {links.map((link, i) => {
            const startNode = nodes.find(n => n.id === link.source);
            const endNode = nodes.find(n => n.id === link.target);
            if (!startNode || !endNode) return null;

            return (
                <Synapse 
                    key={i} 
                    start={[startNode.x, startNode.y, startNode.z]} 
                    end={[endNode.x, endNode.y, endNode.z]} 
                    color={link.color} 
                />
            )
        })}

        {nodes.map((node) => (
            <OrganicNode 
                key={node.id}
                position={[node.x, node.y, node.z]}
                scale={node.isRoot ? 1.8 : 1.2}
                color={getCategoryColor(node.data.category)}
                label={node.data.serviceName}
                onClick={() => onNodeClick && onNodeClick(node.data)}
            />
        ))}

        {nodes.length === 0 && (
             <Text position={[0,0,0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                NO DATA CONNECTION
             </Text>
        )}
      </group>

      {/* [CRITICAL FIX] maxDistance dinaikkan ke 500 agar user bisa zoom out jauh jika node menyebar */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true} 
        autoRotate 
        autoRotateSpeed={0.2} 
        minDistance={2} 
        maxDistance={500} 
      />
    </>
  )
}

export default function NetworkGraph({ group, onNodeClick }: NetworkGraphProps) {
  return (
    <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#020617"]} />
        <Scene group={group} onNodeClick={onNodeClick} />
      </Canvas>
      
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-white font-bold text-sm tracking-widest uppercase opacity-70">
          Neural Connectivity
        </h3>
        <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${group ? 'bg-cyan-400 animate-pulse' : 'bg-red-500'}`}></span>
            <p className="text-[10px] text-cyan-400 font-mono">
                {group ? `LIVE DATA: ${group.children.length + 1} NODES` : 'NO SIGNAL'}
            </p>
        </div>
      </div>
    </div>
  )
}