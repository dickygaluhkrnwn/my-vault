"use client"

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sparkles, Text, Billboard, QuadraticBezierLine } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Account, AccountCategory } from '../../lib/types/schema' 
import { useTheme, Theme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

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

// --- HELPER: WARNA KATEGORI TEMA ---
const getCategoryColor = (category: AccountCategory | string, theme: Theme): string => {
  const isLight = theme === 'formal' || theme === 'casual';
  switch (category) {
    case "GAME": return isLight ? "#9333ea" : "#a855f7"; 
    case "FINANCE": return isLight ? "#059669" : "#10b981"; 
    case "SOCIAL": return isLight ? "#2563eb" : "#3b82f6"; 
    case "WORK": return isLight ? "#d97706" : "#f59e0b"; 
    case "UTILITY": return isLight ? "#ea580c" : "#f97316"; 
    case "ENTERTAINMENT": return isLight ? "#db2777" : "#ec4899"; 
    case "EDUCATION": return isLight ? "#ca8a04" : "#eab308"; 
    case "ECOMMERCE": return isLight ? "#e11d48" : "#f43f5e"; 
    default: return isLight ? "#4f46e5" : "#6366f1"; 
  }
};

// --- HELPER: DETEKSI MOBILE (Sederhana) ---
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    return isMobile;
}

// --- KOMPONEN: ORGANIC CELL (BAKTERI/NEURON) ---
function OrganicNode({ position, color, scale = 1, label, onClick, theme }: { position: [number, number, number], color: string, scale?: number, label?: string, onClick?: () => void, theme: Theme }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)
  const isMobile = useIsMobile();

  // Scale adjustment for mobile touch targets
  const mobileScaleMultiplier = isMobile ? 1.2 : 1;
  const finalScale = scale * mobileScaleMultiplier;

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

  const textColors = {
      formal: { default: "#334155", hover: "#2563eb", outline: "#ffffff" },
      hacker: { default: "#e2e8f0", hover: "#22d3ee", outline: "#020617" },
      casual: { default: "#57534e", hover: "#f97316", outline: "#fff7ed" }
  };

  return (
    <group position={position} onClick={handleClick}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        
        {/* Inti Sel */}
        <mesh ref={glowRef} scale={finalScale * 0.3}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
        </mesh>

        {/* Sitoplasma */}
        <Sparkles count={15} scale={finalScale * 0.8} size={3} speed={0.2} opacity={0.6} color={theme === 'formal' ? "#94a3b8" : "#ffffff"} noise={1} />

        {/* Membran Luar - Teta menggunakan MeshDistortMaterial yang ringan dan organik */}
        <mesh 
            ref={meshRef} 
            scale={hovered ? finalScale * 1.3 : finalScale}
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
        <points scale={hovered ? finalScale * 1.32 : finalScale * 1.02}>
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
                position={[0, finalScale + 0.6, 0]} 
                follow={true} 
                lockX={false} lockY={false} lockZ={false}
            >
                <Text
                    fontSize={hovered || isMobile ? 0.4 : 0.25} 
                    color={hovered ? textColors[theme].hover : textColors[theme].default} 
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={theme !== 'hacker' ? 0.04 : 0.02}
                    outlineColor={textColors[theme].outline} 
                    fillOpacity={hovered || isMobile ? 1 : 0.8} 
                    fontWeight={hovered ? "bold" : "normal"}
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
function NeuralImpulse({ curve, color, speed, theme }: { curve: THREE.QuadraticBezierCurve3, color: string, speed: number, theme: Theme }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    
    useFrame((state) => {
        const t = (state.clock.getElapsedTime() * speed * 0.3) % 1
        const pos = curve.getPoint(t) 
        if (meshRef.current) {
            meshRef.current.position.copy(pos)
        }
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial 
              color={theme === 'formal' ? "#94a3b8" : color} 
              toneMapped={false} 
              transparent 
              opacity={theme === 'formal' ? 0.8 : 0.6} 
            />
        </mesh>
    )
}

// --- KOMPONEN: KONEKSI SINAPSA (DENDRIT) ---
function Synapse({ start, end, color = "#ffffff", theme }: { start: [number, number, number], end: [number, number, number], color?: string, theme: Theme }) {
    const { curve, mid } = useMemo(() => {
        const vStart = new THREE.Vector3(...start)
        const vEnd = new THREE.Vector3(...end)
        const vMid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5)
        const dist = vStart.distanceTo(vEnd)
        
        const curvature = dist * 0.15 
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5), 
            (Math.random() - 0.5), 
            (Math.random() - 0.5)
        ).normalize().multiplyScalar(curvature);
        
        vMid.add(offset);

        const curveObj = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd)
        return { curve: curveObj, mid: vMid }
    }, [start, end])

    const speed = useMemo(() => 0.2 + Math.random() * 0.5, [])
    const lineColor = theme === 'formal' ? "#cbd5e1" : theme === 'casual' ? "#fed7aa" : color;

    return (
        <group>
            <QuadraticBezierLine
                start={new THREE.Vector3(...start)}
                end={new THREE.Vector3(...end)}
                mid={mid}
                color={lineColor}
                lineWidth={theme === 'formal' ? 1.5 : 0.8} 
                transparent
                opacity={theme === 'hacker' ? 0.1 : 0.4} 
            />
            <NeuralImpulse curve={curve} color={color} speed={speed} theme={theme} />
        </group>
    )
}

// --- SCENE UTAMA DENGAN FORCE-DIRECTED LAYOUT ---
function Scene({ group, onNodeClick, theme }: { group?: ConnectionGroup, onNodeClick?: (node: Account) => void, theme: Theme }) {
  
  // ALGORITMA SIMULASI FISIKA 3D
  const { nodes, links } = useMemo(() => {
    if (!group) return { nodes: [], links: [] };

    const physicsNodes: PhysicsNode[] = [];
    const physicsLinks: PhysicsLink[] = [];

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

    group.children.forEach(child => {
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
                color: getCategoryColor(child.category, theme)
            });
        }
    });

    const iterations = 300;
    const repulsionStrength = 60; 
    const springLength = 5;       
    const springStrength = 0.1;   
    const centerPull = 0.03;      

    for (let i = 0; i < iterations; i++) {
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

  }, [group, theme]); 

  const ambientLight = theme === 'formal' ? 0.8 : theme === 'casual' ? 0.6 : 0.2;
  const sparkleColor = theme === 'formal' ? "#94a3b8" : theme === 'casual' ? "#fb923c" : "#ffffff";

  return (
    <>
      <ambientLight intensity={ambientLight} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />

      {/* Efek Post-Processing yang dipisah agar tidak ada error TypeScript Component Element */}
      {theme === 'hacker' ? (
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.2} radius={0.5} />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      ) : (
        <EffectComposer>
          <Vignette eskil={false} offset={0.1} darkness={theme === 'formal' ? 0.8 : 1.1} />
        </EffectComposer>
      )}

      {theme === 'hacker' && <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      <Sparkles count={100} scale={[20, 20, 20]} size={1.5} speed={0.1} opacity={0.3} color={sparkleColor} />

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
                    theme={theme}
                />
            )
        })}

        {nodes.map((node) => (
            <OrganicNode 
                key={node.id}
                position={[node.x, node.y, node.z]}
                scale={node.isRoot ? 1.8 : 1.2}
                color={getCategoryColor(node.data.category, theme)}
                label={node.data.serviceName}
                onClick={() => onNodeClick && onNodeClick(node.data)}
                theme={theme}
            />
        ))}

        {nodes.length === 0 && (
             <Text position={[0,0,0]} fontSize={0.5} color={theme === 'formal' ? "#64748b" : "#ffffff"} anchorX="center" anchorY="middle">
                NO DATA CONNECTION
             </Text>
        )}
      </group>

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
  const { theme } = useTheme();

  // Mobile check untuk menyesuaikan FOV camera
  const isMobile = useIsMobile();
  const fov = isMobile ? 60 : 45; // FOV lebih lebar di mobile agar node tidak terlalu "dekat" di layar kecil
  const cameraZ = isMobile ? 20 : 15; // Mundurkan kamera sedikit di mobile

  const bgColors = {
      formal: "#f8fafc", 
      hacker: "#020617", 
      casual: "#fff7ed"  
  };

  const containerStyles = {
      formal: "bg-slate-50 border-slate-200 shadow-inner",
      hacker: "bg-black border-white/10 shadow-2xl",
      casual: "bg-orange-50 border-orange-200 shadow-inner"
  };

  const textStyles = {
      formal: "text-slate-900",
      hacker: "text-white",
      casual: "text-stone-800"
  };

  return (
    // DIKEMBALIKAN KE H-[600PX] AGAR TIDAK MELAR!
    <div className={cn("w-full h-[600px] rounded-xl overflow-hidden relative border transition-colors duration-500", containerStyles[theme])}>
      <Canvas camera={{ position: [0, 0, cameraZ], fov: fov }} dpr={[1, 2]}>
        <color attach="background" args={[bgColors[theme]]} />
        <Scene group={group} onNodeClick={onNodeClick} theme={theme} />
      </Canvas>
      
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className={cn("font-bold text-sm tracking-widest uppercase opacity-70 transition-colors", textStyles[theme])}>
          Neural Connectivity
        </h3>
        <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${group ? (theme === 'hacker' ? 'bg-cyan-400 animate-pulse' : 'bg-blue-500 animate-pulse') : 'bg-red-500'}`}></span>
            <p className={cn("text-[10px] font-mono transition-colors font-bold", group ? (theme === 'hacker' ? 'text-cyan-400' : 'text-blue-600') : 'text-red-500')}>
                {group ? `LIVE DATA: ${group.children.length + 1} NODES` : 'NO SIGNAL'}
            </p>
        </div>
      </div>
    </div>
  )
}