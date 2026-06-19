import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  RoundedBox,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useStore } from "@/store/useStore";

function Cell({
  row,
  col,
  value,
  isSelected,
  isHovered,
  isConflictRow,
  isConflictCol,
  isSuggested,
  totalRows,
  totalCols,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  row: number;
  col: number;
  value: number;
  isSelected: boolean;
  isHovered: boolean;
  isConflictRow: boolean;
  isConflictCol: boolean;
  isSuggested: boolean;
  totalRows: number;
  totalCols: number;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const offsetX = (col - totalCols / 2 + 0.5) * 1.3;
  const offsetZ = (row - totalRows / 2 + 0.5) * 1.3;

  const baseColor = useMemo(() => {
    if (isConflictRow || isConflictCol) return value === 1 ? "#ff3355" : "#550011";
    if (isSuggested) return "#ffaa00";
    return value === 1 ? "#00ff88" : "#1a1a2e";
  }, [value, isConflictRow, isConflictCol, isSuggested]);

  const emissiveIntensity = useMemo(() => {
    if (isConflictRow || isConflictCol) return 0.7;
    if (isSelected) return 0.6;
    if (isHovered) return 0.3;
    return value === 1 ? 0.15 : 0;
  }, [isConflictRow, isConflictCol, isSelected, isHovered, value]);

  const targetScale = useMemo(() => {
    if (isConflictRow || isConflictCol) return 1.15;
    if (isSelected) return 1.12;
    if (isHovered) return 1.05;
    return 1;
  }, [isConflictRow, isConflictCol, isSelected, isHovered]);

  const targetY = useMemo(() => {
    if (isConflictRow || isConflictCol) return 0.35;
    if (isSelected) return 0.3;
    if (isSuggested) return 0.15;
    return 0;
  }, [isConflictRow, isConflictCol, isSelected, isSuggested]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.15
    );
    const pos = meshRef.current.position;
    pos.y += (targetY - pos.y) * 0.15;

    if (glowRef.current && value === 1) {
      glowRef.current.intensity = isSelected
        ? 1.5 + Math.sin(Date.now() * 0.005) * 0.5
        : 0.5;
    }
  });

  return (
    <group position={[offsetX, 0, offsetZ]}>
      <RoundedBox
        ref={meshRef}
        args={[1, 0.25, 1]}
        radius={0.08}
        smoothness={4}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={onPointerOut}
      >
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={isSelected ? 1 : isHovered ? 0.95 : 0.85}
          roughness={0.3}
          metalness={0.5}
        />
      </RoundedBox>
      {value === 1 && (
        <pointLight
          ref={glowRef}
          color={isConflictRow || isConflictCol ? "#ff3355" : "#00ff88"}
          intensity={isSelected ? 1.5 : 0.5}
          distance={2}
          position={[0, 0.5, 0]}
        />
      )}
      {isSelected && (
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.48, 32]} />
          <meshBasicMaterial
            color={isConflictRow || isConflictCol ? "#ff3355" : "#00d4ff"}
            transparent
            opacity={isConflictRow || isConflictCol ? 0.9 : 0.8}
          />
        </mesh>
      )}
      {(isConflictRow || isConflictCol) && (
        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.4, 32]} />
          <meshBasicMaterial color="#ff3355" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function RowLabel({
  row,
  totalRows,
  isConflict,
}: {
  row: number;
  totalRows: number;
  isConflict: boolean;
}) {
  const offsetZ = (row - totalRows / 2 + 0.5) * 1.3;
  return (
    <Text
      position={[-totalRows * 0.65 - 0.5, 0.2, offsetZ]}
      fontSize={0.4}
      color={isConflict ? "#ff3355" : "#556677"}
      anchorX="right"
      font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf"
    >
      {`R${row}`}
    </Text>
  );
}

function ColLabel({
  col,
  totalCols,
  isConflict,
}: {
  col: number;
  totalCols: number;
  isConflict: boolean;
}) {
  const offsetX = (col - totalCols / 2 + 0.5) * 1.3;
  return (
    <Text
      position={[offsetX, 0.2, -totalCols * 0.65 - 0.5]}
      fontSize={0.4}
      color={isConflict ? "#ff3355" : "#556677"}
      anchorY="bottom"
      font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf"
    >
      {`C${col}`}
    </Text>
  );
}

function GridFloor({ totalRows, totalCols }: { totalRows: number; totalCols: number }) {
  const width = totalCols * 1.3 + 0.5;
  const depth = totalRows * 1.3 + 0.5;
  return (
    <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        color="#0a0a1a"
        transparent
        opacity={0.6}
        roughness={0.8}
      />
    </mesh>
  );
}

function MatrixScene() {
  const {
    matrix,
    rows,
    cols,
    selectedCells,
    hoveredCell,
    conflictRows,
    conflictCols,
    suggestedCells,
    viewMode,
    toggleCell,
    toggleCellValue,
    setHoveredCell,
  } = useStore();

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (viewMode === "edit") {
        toggleCell(row, col);
      } else {
        toggleCellValue(row, col);
      }
    },
    [viewMode, toggleCell, toggleCellValue]
  );

  return (
    <>
      <ambientLight intensity={0.2} color="#4466aa" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        color="#ffffff"
        castShadow
      />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#00d4ff" />

      <GridFloor totalRows={rows} totalCols={cols} />

      {matrix.map((rowData, row) =>
        rowData.map((value, col) => {
          const key = `${row},${col}`;
          return (
            <Cell
              key={key}
              row={row}
              col={col}
              value={value}
              isSelected={selectedCells.has(key)}
              isHovered={
                hoveredCell?.row === row && hoveredCell?.col === col
              }
              isConflictRow={conflictRows.has(row)}
              isConflictCol={conflictCols.has(col)}
              isSuggested={suggestedCells.has(key)}
              totalRows={rows}
              totalCols={cols}
              onClick={() => handleCellClick(row, col)}
              onPointerOver={() => setHoveredCell({ row, col })}
              onPointerOut={() => setHoveredCell(null)}
            />
          );
        })
      )}

      {Array.from({ length: rows }, (_, i) => (
        <RowLabel
          key={`rl-${i}`}
          row={i}
          totalRows={rows}
          isConflict={conflictRows.has(i)}
        />
      ))}
      {Array.from({ length: cols }, (_, j) => (
        <ColLabel
          key={`cl-${j}`}
          col={j}
          totalCols={cols}
          isConflict={conflictCols.has(j)}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Matrix3D() {
  return (
    <div className="w-full h-full bg-[#050510]">
      <Canvas
        camera={{ position: [8, 10, 8], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => useStore.getState().setHoveredCell(null)}
      >
        <color attach="background" args={["#050510"]} />
        <fog attach="fog" args={["#050510", 20, 40]} />
        <MatrixScene />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
