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
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleLogin = async (values: any) => {
        setLoading(true);
        try {
            const result = await authApi.login(values.phone, values.password);
            setAuth(result.access_token, result.user_id, result.nickname, result.role);
            Toast.show({ content: '登录成功', icon: 'success' });
            navigate('/');
        } catch (error: any) {
            Toast.show({ content: error.message || '登录失败', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (values: any) => {
        if (values.password !== values.confirmPassword) {
            Toast.show({ content: '两次输入的密码不一致', icon: 'fail' });
            return;
        }

        setLoading(true);
        try {
            const result = await authApi.register(values.phone, values.password, values.nickname);
            setAuth(result.access_token, result.user_id, result.nickname, result.role);
            Toast.show({ content: '注册成功', icon: 'success' });
            navigate('/');
        } catch (error: any) {
            Toast.show({ content: error.message || '注册失败', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backdropGlow} />
            <div className={styles.shell}>
                <div className={styles.hero}>
                    <div className={styles.kicker}>AI 装修预算助手</div>
                    <h1>智能预算 · 全程陪跑</h1>
                    <p>从预算估算、报价审核到施工陪跑，用一套统一的工具把装修这件事讲清楚。</p>
                </div>

                <div className={styles.card}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <Tabs.Tab title="登录" key="login">
                            <Form onFinish={handleLogin} layout="vertical" style={{ marginTop: 18 }}>
                                <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                                    <Input placeholder="请输入手机号" type="tel" maxLength={11} clearable />
                                </Form.Item>
                                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                                    <Input placeholder="请输入密码" type="password" clearable />
                                </Form.Item>
                                <Button block type="submit" color="primary" size="large" loading={loading} style={{ marginTop: 12, height: 48 }}>
                                    登录
                                </Button>
                            </Form>
                        </Tabs.Tab>

                        <Tabs.Tab title="注册" key="register">
                            <Form onFinish={handleRegister} layout="vertical" style={{ marginTop: 18 }}>
                                <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                                    <Input placeholder="请输入手机号" type="tel" maxLength={11} clearable />
                                </Form.Item>
                                <Form.Item name="nickname" label="昵称">
                                    <Input placeholder="给自己取个好记的名字" clearable />
                                </Form.Item>
                                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请设置密码' }]}>
                                    <Input placeholder="请设置密码" type="password" clearable />
                                </Form.Item>
                                <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请再次输入密码' }]}>
                                    <Input placeholder="再次输入密码" type="password" clearable />
                                </Form.Item>
                                <Button block type="submit" color="primary" size="large" loading={loading} style={{ marginTop: 12, height: 48 }}>
                                    注册并进入
                                </Button>
                            </Form>
                        </Tabs.Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Login;