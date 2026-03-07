// src/pages/Login/index.tsx

import React, { useState } from 'react';
import { Form, Input, Button, Toast, Tabs } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import styles from './index.module.css';

const Login: React.FC = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const handleLogin = async (values: any) => {
        setLoading(true);
        try {
            const result = await authApi.login(values.phone, values.password);
            setAuth(result.access_token, result.user_id, result.nickname, result.role);
            Toast.show({ content: '登录成功', icon: 'success' });
            navigate('/');
        } catch (e: any) {
            Toast.show({ content: e.message || '登录失败', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (values: any) => {
        if (values.password !== values.confirmPassword) {
            Toast.show({ content: '两次密码不一致', icon: 'fail' });
            return;
        }
        setLoading(true);
        try {
            const result = await authApi.register(
                values.phone,
                values.password,
                values.nickname
            );
            setAuth(result.access_token, result.user_id, result.nickname, result.role);
            Toast.show({ content: '注册成功', icon: 'success' });
            navigate('/');
        } catch (e: any) {
            Toast.show({ content: e.message || '注册失败', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>AI 装修预算助手</h1>
                <p>智能预算 · 全程陪跑</p>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.Tab title="登录" key="login">
                    <Form onFinish={handleLogin} layout="horizontal" style={{ marginTop: 16 }}>
                        <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                            <Input placeholder="请输入手机号" type="tel" maxLength={11} />
                        </Form.Item>
                        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                            <Input placeholder="请输入密码" type="password" />
                        </Form.Item>
                        <Button
                            block
                            type="submit"
                            color="primary"
                            size="large"
                            loading={loading}
                            style={{ marginTop: 24 }}
                        >
                            登录
                        </Button>
                    </Form>
                </Tabs.Tab>

                <Tabs.Tab title="注册" key="register">
                    <Form onFinish={handleRegister} layout="horizontal" style={{ marginTop: 16 }}>
                        <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                            <Input placeholder="请输入手机号" type="tel" maxLength={11} />
                        </Form.Item>
                        <Form.Item name="nickname" label="昵称">
                            <Input placeholder="给自己取个名字（选填）" />
                        </Form.Item>
                        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请设置密码' }]}>
                            <Input placeholder="请设置密码" type="password" />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="确认密码"
                            rules={[{ required: true, message: '请确认密码' }]}
                        >
                            <Input placeholder="再次输入密码" type="password" />
                        </Form.Item>
                        <Button
                            block
                            type="submit"
                            color="primary"
                            size="large"
                            loading={loading}
                            style={{ marginTop: 24 }}
                        >
                            注册
                        </Button>
                    </Form>
                </Tabs.Tab>
            </Tabs>
        </div>
    );
};

export default Login;
