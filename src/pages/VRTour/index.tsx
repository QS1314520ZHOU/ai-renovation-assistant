import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Tag } from 'antd-mobile';
import * as THREE from 'three';

const DEFAULT_PANORAMA = 'https://images.unsplash.com/photo-1600607688960-e095ff83135f?auto=format&fit=crop&w=2400&q=80';

export default function VRTour() {
    const navigate = useNavigate();
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [panoramaUrl, setPanoramaUrl] = useState(DEFAULT_PANORAMA);
    const [activeUrl, setActiveUrl] = useState(DEFAULT_PANORAMA);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, el.clientWidth / 360, 1, 1100);
        camera.position.set(0, 0, 0.1);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(el.clientWidth, 360);
        el.innerHTML = '';
        el.appendChild(renderer.domElement);

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const texture = new THREE.TextureLoader().load(activeUrl);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let isDragging = false;
        let lon = 0;
        let lat = 0;
        let pointerStartX = 0;
        let pointerStartY = 0;
        let lonStart = 0;
        let latStart = 0;

        const onPointerDown = (event: PointerEvent) => {
            isDragging = true;
            pointerStartX = event.clientX;
            pointerStartY = event.clientY;
            lonStart = lon;
            latStart = lat;
        };
        const onPointerMove = (event: PointerEvent) => {
            if (!isDragging) return;
            lon = (pointerStartX - event.clientX) * 0.1 + lonStart;
            lat = (event.clientY - pointerStartY) * 0.1 + latStart;
        };
        const onPointerUp = () => {
            isDragging = false;
        };
        const onWheel = (event: WheelEvent) => {
            camera.fov = Math.min(100, Math.max(35, camera.fov + event.deltaY * 0.05));
            camera.updateProjectionMatrix();
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('wheel', onWheel);

        let frameId = 0;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            lat = Math.max(-85, Math.min(85, lat));
            const phi = THREE.MathUtils.degToRad(90 - lat);
            const theta = THREE.MathUtils.degToRad(lon);
            camera.lookAt(
                500 * Math.sin(phi) * Math.cos(theta),
                500 * Math.cos(phi),
                500 * Math.sin(phi) * Math.sin(theta),
            );
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!mountRef.current) return;
            const width = mountRef.current.clientWidth;
            renderer.setSize(width, 360);
            camera.aspect = width / 360;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(frameId);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            renderer.domElement.removeEventListener('wheel', onWheel);
            window.removeEventListener('resize', onResize);
            texture.dispose();
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            scene.clear();
        };
    }, [activeUrl]);

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}>VR 漫游</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>360 全景预览（拖拽或滑动查看）</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>返回</Button>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>全景画面</h3>
                        <Tag color="primary" fill="outline">移动端可用</Tag>
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
                        <h3>替换全景图</h3>
                        <span className="inline-pill">支持公网图片 URL</span>
                    </div>
                    <Input
                        value={panoramaUrl}
                        onChange={setPanoramaUrl}
                        placeholder="粘贴 360 全景图 URL"
                        clearable
                    />
                    <div className="action-row" style={{ marginTop: 12 }}>
                        <Button block color="primary" shape="rounded" onClick={() => setActiveUrl(panoramaUrl || DEFAULT_PANORAMA)}>
                            加载全景图
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
