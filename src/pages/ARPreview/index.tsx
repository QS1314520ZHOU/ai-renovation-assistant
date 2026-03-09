import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Toast } from 'antd-mobile';
import * as THREE from 'three';

export default function ARPreview() {
    const navigate = useNavigate();
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const furnitureRef = useRef<THREE.Mesh | null>(null);
    const floorRef = useRef<THREE.Mesh | null>(null);
    const wallRef = useRef<THREE.Mesh | null>(null);

    const [floorColor, setFloorColor] = useState('#a16207');
    const [wallColor, setWallColor] = useState('#f8fafc');
    const [furnitureColor, setFurnitureColor] = useState('#334155');
    const [xrSupported, setXrSupported] = useState(false);
    const [arActive, setArActive] = useState(false);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#dbeafe');

        const camera = new THREE.PerspectiveCamera(60, el.clientWidth / 320, 0.1, 1000);
        camera.position.set(0, 1.6, 3.6);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(el.clientWidth, 320);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        el.innerHTML = '';
        el.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const hemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.9);
        scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 0.7);
        dir.position.set(2, 4, 1);
        scene.add(dir);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 8),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(floorColor), roughness: 0.75 }),
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        floorRef.current = floor;

        const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(wallColor), side: THREE.BackSide });
        const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
        walls.position.y = 2;
        scene.add(walls);
        wallRef.current = walls;

        const sofa = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.8, 0.8),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(furnitureColor), roughness: 0.5 }),
        );
        sofa.position.set(0, 0.4, -1.2);
        scene.add(sofa);
        furnitureRef.current = sofa;

        const table = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.45, 24),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }),
        );
        table.position.set(0.9, 0.25, -0.5);
        scene.add(table);

        let angle = 0;
        let frameId = 0;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            angle += 0.004;
            camera.position.x = Math.sin(angle) * 3.4;
            camera.position.z = Math.cos(angle) * 3.4;
            camera.lookAt(0, 1.2, 0);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current) return;
            const width = mountRef.current.clientWidth;
            rendererRef.current.setSize(width, 320);
            camera.aspect = width / 320;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        const xr = (navigator as any).xr;
        if (xr && typeof xr.isSessionSupported === 'function') {
            xr.isSessionSupported('immersive-ar')
                .then((ok: boolean) => setXrSupported(Boolean(ok)))
                .catch(() => setXrSupported(false));
        }

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    useEffect(() => {
        if (floorRef.current) {
            const mat = floorRef.current.material as THREE.MeshStandardMaterial;
            mat.color = new THREE.Color(floorColor);
            mat.needsUpdate = true;
        }
    }, [floorColor]);

    useEffect(() => {
        if (wallRef.current) {
            const mat = wallRef.current.material as THREE.MeshStandardMaterial;
            mat.color = new THREE.Color(wallColor);
            mat.needsUpdate = true;
        }
    }, [wallColor]);

    useEffect(() => {
        if (furnitureRef.current) {
            const mat = furnitureRef.current.material as THREE.MeshStandardMaterial;
            mat.color = new THREE.Color(furnitureColor);
            mat.needsUpdate = true;
        }
    }, [furnitureColor]);

    const startArSession = async () => {
        try {
            const renderer = rendererRef.current;
            const xr = (navigator as any).xr;
            if (!renderer || !xr) {
                Toast.show({ icon: 'fail', content: '当前设备不支持 WebXR' });
                return;
            }

            renderer.xr.enabled = true;
            const session = await xr.requestSession('immersive-ar', {
                requiredFeatures: [],
                optionalFeatures: ['local-floor', 'hit-test'],
            });
            await renderer.xr.setSession(session);
            setArActive(true);
            session.addEventListener('end', () => setArActive(false));
        } catch (error: any) {
            Toast.show({ icon: 'fail', content: error?.message || 'AR 会话启动失败' });
        }
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(14,165,233,0.12)', color: '#0369a1' }}>AR 预览</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>先做轻量 WebGL 预览，再进入 AR 会话</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>返回</Button>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>房间预览</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Tag color={xrSupported ? 'success' : 'warning'} fill="outline">
                                {xrSupported ? '设备支持 AR' : '设备不支持 AR'}
                            </Tag>
                            {arActive && <Tag color="primary">AR 会话中</Tag>}
                        </div>
                    </div>
                    <div
                        ref={mountRef}
                        style={{
                            width: '100%',
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: '1px solid rgba(148,163,184,0.24)',
                        }}
                    />
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>材质切换</h3>
                        <span className="inline-pill">模拟地板/墙面/家具</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span className="feature-desc">地板颜色</span>
                            <input type="color" value={floorColor} onChange={(e) => setFloorColor(e.target.value)} style={{ width: '100%', height: 40 }} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span className="feature-desc">墙面颜色</span>
                            <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} style={{ width: '100%', height: 40 }} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span className="feature-desc">家具颜色</span>
                            <input type="color" value={furnitureColor} onChange={(e) => setFurnitureColor(e.target.value)} style={{ width: '100%', height: 40 }} />
                        </label>
                    </div>
                    <div className="action-row" style={{ marginTop: 14 }}>
                        <Button
                            block
                            color="primary"
                            shape="rounded"
                            disabled={!xrSupported}
                            onClick={startArSession}
                        >
                            启动 AR 预览
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
